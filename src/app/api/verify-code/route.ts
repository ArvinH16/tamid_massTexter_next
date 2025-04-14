import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();
    
    if (accessCode === process.env.ACCESS_CODE) {
      return NextResponse.json({ success: true });
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