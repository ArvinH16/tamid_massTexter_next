import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Convert the file to a buffer
        const buffer = await file.arrayBuffer();

        // Read the Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Get the "Main Roster" sheet (case-insensitive)
        const targetSheetName = 'Main Roster';
        const sheetNames = workbook.SheetNames;

        // Find the sheet with case-insensitive matching
        const sheetName = sheetNames.find(name =>
            name.toLowerCase() === targetSheetName.toLowerCase()
        );

        if (!sheetName) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Sheet "${targetSheetName}" not found in the Excel file. Available sheets: ${sheetNames.join(', ')}`
                },
                { status: 400 }
            );
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert the worksheet to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Process the data to extract contacts
        const contacts = data.map((row: unknown) => {
            // Cast row to a more specific type
            const typedRow = row as Record<string, unknown>;
            
            // Find the name and phone columns (case-insensitive)
            const nameKey = Object.keys(typedRow).find(key => 
                key.toLowerCase().includes('name') || 
                key.toLowerCase().includes('first') || 
                key.toLowerCase().includes('last')
            );
            
            const phoneKey = Object.keys(typedRow).find(key => 
                key.toLowerCase().includes('phone') || 
                key.toLowerCase().includes('number') || 
                key.toLowerCase().includes('mobile')
            );

            if (!nameKey || !phoneKey) {
                return null;
            }

            // Format phone number (remove any non-digit characters)
            let phoneNumber = String(typedRow[phoneKey]).replace(/\D/g, '');
            
            // Add country code if not present (assuming US numbers)
            if (phoneNumber.length === 10) {
                phoneNumber = '+1' + phoneNumber;
            } else if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }

            return {
                name: String(typedRow[nameKey]).trim(),
                phone: phoneNumber
            };
        }).filter(Boolean);

        if (contacts.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid contacts found in the Excel file' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error parsing Excel file:', error);
        return NextResponse.json(
            { success: false, message: 'Error parsing Excel file' },
            { status: 500 }
        );
    }
} 