import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const accessCode = request.cookies.get('access-code');
  
  if (!accessCode) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Verify the access code exists in the database
  const organization = await getOrganizationByAccessCode(accessCode.value);
  
  if (!organization) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ 
    success: true,
    organizationId: organization.id,
    chapterName: organization.chapter_name
  });
} 