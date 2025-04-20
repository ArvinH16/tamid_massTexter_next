import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth-token');
  
  if (!authToken || authToken.value !== process.env.ACCESS_CODE) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ success: true });
} 