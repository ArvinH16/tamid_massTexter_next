import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getOrganizationByAccessCode, updateMessageSent } from '@/lib/supabase';

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

// Define contact interface
interface Contact {
  phone: string;
  name: string;
  email?: string;
}

// Define results interface
interface SendResults {
  success: number;
  failed: number;
  failedNumbers: FailedNumber[];
}

interface FailedNumber {
  phoneNumber: string;
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get access code from cookie
    const accessCode = request.cookies.get('access-code');

    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization from database
    const organization = await getOrganizationByAccessCode(accessCode.value);

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Twilio client
    const client = initTwilioClient();

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const contactsJson = formData.get('contacts') as string;

    // Validate message
    if (!validateMessage(message)) {
      return NextResponse.json(
        { success: false, message: 'Invalid message. Message must be a string of maximum 1600 characters.' },
        { status: 400 }
      );
    }

    // Parse contacts
    const contacts: Contact[] = JSON.parse(contactsJson);

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid contacts provided' },
        { status: 400 }
      );
    }

    // Filter out contacts without phone numbers
    const validContacts = contacts.filter(contact => {
      // Basic phone number validation - must contain at least 10 digits
      const phoneDigits = contact.phone.replace(/\D/g, '');
      return phoneDigits.length >= 10;
    });

    if (validContacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No contacts with valid phone numbers found' },
        { status: 400 }
      );
    }

    // Check if sending would exceed monthly limit
    const today = new Date();
    const lastMessageDate = organization.last_message_sent ? new Date(organization.last_message_sent) : null;

    // If last message was sent in a previous month, reset the count
    if (lastMessageDate &&
      (lastMessageDate.getMonth() !== today.getMonth() ||
        lastMessageDate.getFullYear() !== today.getFullYear())) {
      // Reset message_sent to 0 for the new month
      await updateMessageSent(organization.id, 0);
      organization.message_sent = 0;
    }

    // Check if sending would exceed monthly limit
    if (validContacts.length > (organization.message_limit - organization.message_sent)) {
      return NextResponse.json(
        {
          success: false,
          message: `Monthly message limit would be exceeded. You have ${organization.message_limit - organization.message_sent} messages remaining this month, but your file contains ${validContacts.length} contacts.`
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
    for (const contact of validContacts) {
      try {
        // Personalize message if name is available
        const personalizedMessage = contact.name ? message.replace(/{name}/gi, contact.name) : message;

        await client.messages.create({
          body: personalizedMessage,
          from: organization.twilio_number || process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });

        results.success++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failedNumbers.push({ phoneNumber: contact.phone, error: errorMessage });
      }
    }

    console.log(`Successfully sent ${results.success} messages. Failed: ${results.failed}`);

    try {
      // Fetch the latest organization data
      const updatedOrg = await getOrganizationByAccessCode(accessCode.value);
      if (!updatedOrg) {
        throw new Error('Failed to fetch updated organization data');
      }
      console.log('Current organization data before update:', updatedOrg);
      
      // Handle NULL values for message_sent
      const currentMessageSent = updatedOrg.message_sent === null ? 0 : updatedOrg.message_sent;
      const newMessageSent = currentMessageSent + results.success;
      console.log(`Calculating new message count: ${currentMessageSent} + ${results.success} = ${newMessageSent}`);
      
      // Update message sent count with the latest data
      console.log(`Calling updateMessageSent with orgId=${organization.id}, newCount=${newMessageSent}`);
      const updateResult = await updateMessageSent(organization.id, newMessageSent);
      
      if (!updateResult) {
        console.error("Failed to update message count in database");
        // Continue execution but log the error
      } else {
        console.log(`Successfully updated message count to ${newMessageSent}`);
      }
      
      // Fetch the data one more time to confirm
      const finalCheck = await getOrganizationByAccessCode(accessCode.value);
      console.log('Final organization data after update attempt:', finalCheck);
      
      return NextResponse.json({
        success: true,
        results: {
          totalSent: results.success,
          totalFailed: results.failed,
          failedNumbers: results.failedNumbers,
          remainingToday: finalCheck ? (finalCheck.message_limit - (finalCheck.message_sent || 0)) : 'unknown'
        }
      });
    } catch (error) {
      console.error('Error updating message count:', error);
      // Still return success for messages that were sent
      return NextResponse.json({
        success: true,
        results: {
          totalSent: results.success,
          totalFailed: results.failed,
          failedNumbers: results.failedNumbers,
          remainingToday: 'unknown',
          updateError: error instanceof Error ? error.message : 'Unknown error updating message count'
        }
      });
    }
  } catch (error: unknown) {
    console.error('Error processing messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error processing messages';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get access code from cookie
    const accessCode = request.cookies.get('access-code');

    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization from database
    const organization = await getOrganizationByAccessCode(accessCode.value);

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate remaining messages for the month
    const today = new Date();
    const lastMessageDate = organization.last_message_sent ? new Date(organization.last_message_sent) : null;

    // If last message was sent in a previous month, reset the count
    if (lastMessageDate &&
      (lastMessageDate.getMonth() !== today.getMonth() ||
        lastMessageDate.getFullYear() !== today.getFullYear())) {
      // Reset message_sent to 0 for the new month
      await updateMessageSent(organization.id, 0);
      organization.message_sent = 0;
    }

    // Ensure message_sent is not null or undefined
    const messagesSent = organization.message_sent ?? 0;
    const messageLimit = organization.message_limit ?? 100; // Use 100 as default if undefined
    
    // Calculate remaining messages
    const remaining = messageLimit - messagesSent;

    // Calculate reset date (first day of next month)
    const resetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return NextResponse.json({
      monthlyLimit: messageLimit,
      messagesSent: messagesSent,
      remaining: remaining,
      resetDate: resetDate.toISOString()
    });
  } catch (error) {
    console.error('Error getting message limit:', error);
    return NextResponse.json(
      { success: false, message: 'Error getting message limit' },
      { status: 500 }
    );
  }
}

// Basic message validation
function validateMessage(message: string) {
  if (!message || typeof message !== 'string') return false;
  if (message.length > 1600) return false; // Twilio's limit
  return true;
} 