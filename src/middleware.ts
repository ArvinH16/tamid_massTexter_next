import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if this is a protected route
  if (path === '/mass-text' || path === '/sent-messages') {
    // Check if user is authenticated via cookie
    const accessCode = request.cookies.get('access-code');
    
    if (!accessCode) {
      // Redirect to home page if not authenticated
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/mass-text', '/sent-messages']
}; 