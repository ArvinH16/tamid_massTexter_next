import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Define the contact interface
interface Contact {
  name: string;
  phone: string;
}

export async function GET() {
  try {
    // Get the Google Sheet ID from the environment variable
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      return NextResponse.json(
        { success: false, message: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Initialize the Google Sheets API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get the sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Main Roster', // The sheet name
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No data found in the Google Sheet' },
        { status: 404 }
      );
    }

    // Process the data to extract contacts
    // Assuming the first row contains headers
    const headers = rows[0].map(header => header.toLowerCase());
    
    // Find the name and phone columns
    const nameIndex = headers.findIndex(header => 
      header.includes('name') || 
      header.includes('first') || 
      header.includes('last')
    );
    
    const phoneIndex = headers.findIndex(header => 
      header.includes('phone') || 
      header.includes('number') || 
      header.includes('mobile')
    );

    if (nameIndex === -1 || phoneIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Required columns (name and phone) not found in the Google Sheet' },
        { status: 400 }
      );
    }

    // Process the rows to extract contacts
    const contacts: Contact[] = rows.slice(1).map(row => {
      // Format phone number (remove any non-digit characters)
      let phoneNumber = String(row[phoneIndex]).replace(/\D/g, '');
      
      // Add country code if not present (assuming US numbers)
      if (phoneNumber.length === 10) {
        phoneNumber = '+1' + phoneNumber;
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }

      return {
        name: String(row[nameIndex]).trim(),
        phone: phoneNumber
      };
    }).filter(contact => contact.name && contact.phone);

    if (contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid contacts found in the Google Sheet' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      contacts
    });
  } catch (error: unknown) {
    console.error('Error fetching Google Sheet data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching Google Sheet data';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 