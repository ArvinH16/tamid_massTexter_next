import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, uploadContactsWithDuplicateCheck } from '@/lib/supabase';

interface Contact {
    name: string;
    phone: string;
    email?: string;
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

        // Parse request body
        const { contacts } = await request.json();

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid contacts provided' },
                { status: 400 }
            );
        }

        // Validate contacts
        const validContacts: Contact[] = [];
        const invalidContacts: { contact: Contact; reason: string }[] = [];

        for (const contact of contacts) {
            if (!contact.name || !contact.phone) {
                invalidContacts.push({
                    contact,
                    reason: 'Missing name or phone number'
                });
                continue;
            }

            // Basic phone number validation (can be enhanced)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(contact.phone.replace(/\D/g, ''))) {
                invalidContacts.push({
                    contact,
                    reason: 'Invalid phone number format'
                });
                continue;
            }

            validContacts.push(contact);
        }

        if (validContacts.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No valid contacts to preview',
                    invalidContacts
                },
                { status: 400 }
            );
        }

        // Get preview of contacts upload
        const result = await uploadContactsWithDuplicateCheck(
            organization.id.toString(), 
            validContacts,
            true // Preview only - don't actually upload
        );

        return NextResponse.json({
            success: true,
            toUpload: result.toUpload || 0,
            skipped: result.skipped,
            flagged: result.flagged || 0,
            newContacts: result.newContacts || [],
            existingContacts: result.existingContacts || [],
            flaggedContacts: result.flaggedContacts || [],
            invalidContacts
        });
    } catch (error: unknown) {
        console.error('Error previewing contacts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error previewing contacts';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }
} 