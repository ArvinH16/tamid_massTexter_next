import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, updateOrgMember } from '@/lib/supabase';

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

    // Get the contact ID and new opted_out status from the request body
    const body = await request.json();
    const { contactId, optedOut } = body;

    if (!contactId) {
      return NextResponse.json(
        { success: false, message: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Update the org member's opted_out status
    const success = await updateOrgMember(contactId, { opted_out: optedOut });

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update opt-out status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Contact ${optedOut ? 'opted out' : 'opted in'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling opt-out status:', error);
    return NextResponse.json(
      { success: false, message: 'Error toggling opt-out status' },
      { status: 500 }
    );
  }
} 