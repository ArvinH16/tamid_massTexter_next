import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();
    
    if (accessCode === process.env.ACCESS_CODE) {
      // Create a response with cookie
      const response = NextResponse.json({ success: true });
      
      // Set a secure HTTP-only cookie
      response.cookies.set({
        name: 'auth-token',
        value: process.env.ACCESS_CODE!,
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