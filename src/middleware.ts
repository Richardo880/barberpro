/**
 * Next.js Middleware
 * Protege rutas y maneja autenticación/autorización
 * Supports both NextAuth cookies (web) and Bearer tokens (mobile)
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rutas de admin requieren role ADMIN o STAFF
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN' && token?.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/mi-cuenta', req.url));
      }
    }

    // Continuar normalmente
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Public API endpoints that don't require auth
        const publicPaths = ['/api/appointments/available-slots'];
        if (publicPaths.includes(req.nextUrl.pathname)) {
          return true;
        }
        // Mobile clients use Bearer tokens - let them through
        // Route handlers verify the token via getSessionFromRequest()
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          return true;
        }
        // Web clients need a valid NextAuth session
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configurar qué rutas requieren autenticación
export const config = {
  matcher: [
    // Proteger todas las rutas de /mi-cuenta y /admin
    '/mi-cuenta/:path*',
    '/admin/:path*',
    // Proteger API routes privadas
    '/api/appointments/:path*',
    '/api/clients/:path*',
    '/api/records/:path*',
  ],
};
