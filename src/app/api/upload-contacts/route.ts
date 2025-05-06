import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, uploadContacts } from '@/lib/supabase';

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
            if (!contact.name) {
                invalidContacts.push({
                    contact,
                    reason: 'Missing name'
                });
                continue;
            }

            // If phone number exists, validate it
            if (contact.phone) {
                const phoneRegex = /^\+?[1-9]\d{1,14}$/;
                if (!phoneRegex.test(contact.phone.replace(/\D/g, ''))) {
                    invalidContacts.push({
                        contact,
                        reason: 'Invalid phone number format'
                    });
                    continue;
                }
            }

            validContacts.push(contact);
        }

        if (validContacts.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'No valid contacts to upload',
                    invalidContacts
                },
                { status: 400 }
            );
        }

        // Upload contacts to database
        const result = await uploadContacts(organization.id.toString(), validContacts);

        return NextResponse.json({
            success: true,
            uploaded: result.uploaded,
            skipped: result.skipped,
            invalidContacts
        });
    } catch (error: unknown) {
        console.error('Error uploading contacts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error uploading contacts';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }
} 