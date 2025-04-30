import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, updateOrgMember } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

interface ContactUpdate {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
}

export async function PUT(request: NextRequest) {
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
        const updateData: ContactUpdate = await request.json();
        
        if (!updateData || !updateData.id) {
            return NextResponse.json(
                { success: false, message: 'Invalid update data' },
                { status: 400 }
            );
        }
        
        // Prepare the update object
        const updates: Record<string, any> = {};
        
        if (updateData.first_name !== undefined) {
            updates.first_name = updateData.first_name;
        }
        
        if (updateData.last_name !== undefined) {
            updates.last_name = updateData.last_name;
        }
        
        if (updateData.email !== undefined) {
            updates.email = updateData.email;
        }
        
        if (updateData.phone_number !== undefined) {
            updates.phone_number = formatPhoneNumber(updateData.phone_number);
        }
        
        // Check if there's anything to update
        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid updates provided' },
                { status: 400 }
            );
        }
        
        // Update the contact
        const success = await updateOrgMember(updateData.id, updates);
        
        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Failed to update contact' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Contact updated successfully'
        });
    } catch (error: unknown) {
        console.error('Error updating contact:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error updating contact';
        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 500 }
        );
    }
} 