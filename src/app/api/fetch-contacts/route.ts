import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, getOrgMembersByOrgId } from '@/lib/supabase';

// Define the contact interface
interface Contact {
  name: string;
  phone: string;
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
    
    // Get org members from database
    const orgMembers = await getOrgMembersByOrgId(organization.id);
    
    // If no members found, return empty array instead of error
    if (!orgMembers || orgMembers.length === 0) {
      return NextResponse.json(
        { success: true, contacts: [] },
        { status: 200 }
      );
    }
    
    // Process the data to extract contacts
    const contacts: Contact[] = orgMembers.map(member => {
      // Format phone number (remove any non-digit characters)
      let phoneNumber = String(member.phone_number).replace(/\D/g, '');
      
      // Add country code if not present (assuming US numbers)
      if (phoneNumber.length === 10) {
        phoneNumber = '+1' + phoneNumber;
      } else if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      
      // Combine first and last name
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
      
      return {
        name: fullName || 'Unknown',
        phone: phoneNumber
      };
    }).filter(contact => contact.phone);
    
    // If no valid contacts after filtering, return empty array
    if (contacts.length === 0) {
      return NextResponse.json(
        { success: true, contacts: [] },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      contacts 
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching contacts' },
      { status: 500 }
    );
  }
} 