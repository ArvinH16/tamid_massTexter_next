import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, deleteOrgMember } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
    try {
        // Extract contactId from URL
        const url = new URL(request.url);
        const contactId = url.searchParams.get('id');
        
        if (!contactId) {
            return NextResponse.json(
                { success: false, message: 'Contact ID is required' },
                { status: 400 }
            );
        }
        
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
        
        // Delete the contact
        const success = await deleteOrgMember(parseInt(contactId));
        
        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Failed to delete contact' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting contact:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error deleting contact';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }
} 