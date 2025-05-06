import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();
    
    // Check if the access code exists in the database
    const organization = await getOrganizationByAccessCode(accessCode);
    
    if (organization) {
      // Create a response with cookie
      const response = NextResponse.json({ 
        success: true,
        organizationId: organization.id,
        chapterName: organization.chapter_name
      });
      
      // Set a secure HTTP-only cookie with the access code
      response.cookies.set({
        name: 'access-code',
        value: accessCode,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      
      return response;
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid access code' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verifying access code:', error);
    return NextResponse.json(
      { success: false, message: 'Error verifying access code' },
      { status: 500 }
    );
  }
} 