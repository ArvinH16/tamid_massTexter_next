import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { google } from 'googleapis';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Initialize Google Sheets client
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Store user states (in memory - will reset when server restarts)
const userStates: { [key: string]: { state: 'waiting_for_name' | 'completed', name?: string } } = {};

// Function to format phone number (remove +1 prefix)
function formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits, remove the 1
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        return digitsOnly.substring(1);
    }
    
    return digitsOnly;
}

// Function to find column indices
async function findColumnIndices(): Promise<{ nameIndex: number, phoneIndex: number }> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Main Roster!A1:Z1', // Get header row
        });

        const headers = response.data.values?.[0] || [];
        const nameIndex = headers.findIndex(header => 
            header.toLowerCase().includes('name') || 
            header.toLowerCase().includes('first') || 
            header.toLowerCase().includes('last')
        );
        const phoneIndex = headers.findIndex(header => 
            header.toLowerCase().includes('phone') || 
            header.toLowerCase().includes('number') || 
            header.toLowerCase().includes('mobile')
        );

        if (nameIndex === -1 || phoneIndex === -1) {
            throw new Error('Required columns not found in sheet');
        }

        return { nameIndex, phoneIndex };
    } catch (error) {
        console.error('Error finding column indices:', error);
        throw error;
    }
}

// Function to check if phone number exists in Google Sheet
async function checkPhoneNumberExists(phoneNumber: string): Promise<boolean> {
    try {
        const { phoneIndex } = await findColumnIndices();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Main Roster!A:Z', // Get all columns
        });

        const rows = response.data.values || [];
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        return rows.some(row => {
            const rowPhone = row[phoneIndex];
            return rowPhone && formatPhoneNumber(rowPhone) === formattedPhone;
        });
    } catch (error) {
        console.error('Error checking phone number:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('Webhook received');
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = (formData.get('Body') as string).toLowerCase().trim();
        
        console.log('Message received:', { from, body });

        // Get or initialize user state
        const userState = userStates[from] || { state: 'waiting_for_name' };
        console.log('User state:', userState);

        // Handle initial "hello" message
        if (body === 'hello' && userState.state === 'waiting_for_name') {
            console.log('Sending welcome message to:', from);
            try {
                const message = await twilioClient.messages.create({
                    body: 'Hi! Welcome to TAMID UW. Please send your full name to be added to our contact list.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from,
                });
                console.log('Welcome message sent successfully:', message.sid);
            } catch (error) {
                console.error('Error sending welcome message:', error);
            }
            return NextResponse.json({ success: true });
        }

        // Handle name submission
        if (userState.state === 'waiting_for_name' && body !== 'hello') {
            console.log('Processing name submission for:', from);
            // Check if phone number already exists
            const exists = await checkPhoneNumberExists(from);
            console.log('Phone number exists:', exists);
            
            if (exists) {
                console.log('Sending already registered message to:', from);
                await twilioClient.messages.create({
                    body: 'This phone number is already registered in our system. If you need to update your information, please contact an administrator.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from,
                });
                return NextResponse.json({ success: true });
            }

            // Store the name and update state
            userState.name = body;
            userState.state = 'completed';
            userStates[from] = userState;
            console.log('Updated user state:', userState);

            // Add the contact to Google Sheets
            try {
                console.log('Adding contact to Google Sheet:', { name: userState.name, phone: from });
                
                // Get column indices
                const { nameIndex, phoneIndex } = await findColumnIndices();
                
                // Create a row with empty values for all columns
                const maxColumn = Math.max(nameIndex, phoneIndex);
                const row = new Array(maxColumn + 1).fill('');
                
                // Format phone number (remove +1 prefix)
                const formattedPhone = formatPhoneNumber(from);
                
                // Set values in the correct columns
                row[nameIndex] = userState.name;
                row[phoneIndex] = formattedPhone;
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID,
                    range: 'Main Roster!A:Z', // Append to all columns
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [row],
                    },
                });

                // Send confirmation message
                console.log('Sending confirmation message to:', from);
                await twilioClient.messages.create({
                    body: `Thank you for showing interest in joining Tamid UW ${userState.name}! You have been added to our contact list.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from,
                });
            } catch (error) {
                console.error('Error adding contact to Google Sheet:', error);
                await twilioClient.messages.create({
                    body: 'Sorry, there was an error adding you to our contact list. Please try again later.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from,
                });
            }
        } else if (userState.state === 'completed') {
            console.log('Sending already completed message to:', from);
            // If we receive another message after completion
            await twilioClient.messages.create({
                body: 'You are already in our contact list. If you need to update your information, please contact an administrator.',
                from: process.env.TWILIO_PHONE_NUMBER,
                to: from,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing webhook' },
            { status: 500 }
        );
    }
} 