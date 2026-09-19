import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export const middleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect logged-in users away from login
    if (pathname === '/login' && token) {
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/employee', req.url));
    }

    // Role-based redirects
    if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/employee', req.url));
    }

    if (pathname.startsWith('/employee') && token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow /login without token
        if (pathname === '/login') {
          return true;
        }

        // Require token for protected routes
        if (pathname.startsWith('/admin') || pathname.startsWith('/employee')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/login'],
};
