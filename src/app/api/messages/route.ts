import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

// Message tracker file path
const TRACKER_FILE = '/tmp/message-tracker.json';
const DEFAULT_DAILY_LIMIT = 100; // Default 100 messages per day

// Function to initialize and validate Twilio client
function initTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Missing required Twilio environment variables. Please check your .env file.');
  }

  return twilio(accountSid, authToken);
}

// Initialize tracker file if it doesn't exist
async function initTrackerFile() {
  try {
    await fs.access(TRACKER_FILE);
  } catch {
    const initialData = {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      messagesSent: 0,
      lastResetDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    };
    
    await fs.writeFile(TRACKER_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  return JSON.parse(await fs.readFile(TRACKER_FILE, 'utf8'));
}

// Get current tracker data
async function getTrackerData() {
  // Initialize if needed
  let data = await initTrackerFile();
  
  // Check if we need to reset the counter for a new day
  const today = new Date().toISOString().split('T')[0];
  if (data.lastResetDate !== today) {
    data = {
      dailyLimit: data.dailyLimit, // Preserve the limit setting
      messagesSent: 0,
      lastResetDate: today
    };
    await saveTrackerData(data);
  }
  
  return data;
}

// Define tracker data interface
interface TrackerData {
  dailyLimit: number;
  messagesSent: number;
  lastResetDate: string;
}

// Save tracker data
async function saveTrackerData(data: TrackerData) {
  await fs.writeFile(TRACKER_FILE, JSON.stringify(data, null, 2));
}

// Check if sending more messages would exceed the daily limit
async function canSendMessages(count: number) {
  const data = await getTrackerData();
  return (data.messagesSent + count) <= data.dailyLimit;
}

// Record sent messages - increases the count
async function recordSentMessages(count: number) {
  const data = await getTrackerData();
  data.messagesSent += count;
  await saveTrackerData(data);
  return data;
}

// Get remaining message count for today
async function getRemainingMessages() {
  const data = await getTrackerData();
  return Math.max(0, data.dailyLimit - data.messagesSent);
}

// Basic phone number validation
function validatePhoneNumber(phone: string) {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

// Basic message validation
function validateMessage(message: string) {
  if (!message || typeof message !== 'string') return false;
  if (message.length > 1600) return false; // Twilio's limit
  return true;
}

// Define contact interface
interface Contact {
  phoneNumber: string;
  name: string;
}

// Define failed number interface
interface FailedNumber {
  phoneNumber: string;
  error: string;
}

// Define results interface
interface SendResults {
  success: number;
  failed: number;
  failedNumbers: FailedNumber[];
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Twilio client
    const client = initTwilioClient();
    
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const file = formData.get('file') as File;
    
    // Validate message
    if (!validateMessage(message)) {
      return NextResponse.json(
        { success: false, message: 'Invalid message. Message must be a string of maximum 1600 characters.' },
        { status: 400 }
      );
    }
    
    // Check if file was uploaded
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Parse CSV file
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Count valid contacts
    let validContacts = 0;
    const contacts = records.map((row: Record<string, string>) => {
      const phoneNumber = row.phone || row.phoneNumber || row.phone_number || row.mobile;
      const name = row.name || row.firstName || row.first_name || '';
      
      if (phoneNumber && validatePhoneNumber(phoneNumber)) {
        validContacts++;
        return { phoneNumber, name };
      }
      return null;
    }).filter(Boolean) as Contact[];
    
    // Check if sending would exceed daily limit
    if (!(await canSendMessages(validContacts))) {
      const trackerData = await getTrackerData();
      const remaining = trackerData.dailyLimit - trackerData.messagesSent;
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Daily message limit would be exceeded. You have ${remaining} messages remaining today, but your file contains ${validContacts} contacts. The limit resets at midnight UTC.` 
        },
        { status: 429 }
      );
    }
    
    // Track success and failures
    const results: SendResults = {
      success: 0,
      failed: 0,
      failedNumbers: []
    };
    
    // Send messages
    for (const contact of contacts) {
      try {
        // Personalize message if name is available
        const personalizedMessage = contact.name ? message.replace('{name}', contact.name) : message;
        
        await client.messages.create({
          body: personalizedMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phoneNumber
        });
        
        results.success++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failedNumbers.push({ phoneNumber: contact.phoneNumber, error: errorMessage });
      }
    }
    
    // Record the successful messages in our tracker
    await recordSentMessages(results.success);
    
    return NextResponse.json({
      success: true,
      results: {
        totalSent: results.success,
        totalFailed: results.failed,
        failedNumbers: results.failedNumbers,
        remainingToday: await getRemainingMessages()
      }
    });
  } catch (error: unknown) {
    console.error('Error processing messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error processing messages';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await getTrackerData();
    return NextResponse.json({
      dailyLimit: data.dailyLimit,
      messagesSent: data.messagesSent,
      remaining: data.dailyLimit - data.messagesSent,
      resetDate: new Date(data.lastResetDate + 'T00:00:00').toISOString()
    });
  } catch (error) {
    console.error('Error getting message limit:', error);
    return NextResponse.json(
      { success: false, message: 'Error getting message limit' },
      { status: 500 }
    );
  }
} 