/**
 * Next.js Middleware
 * Protege rutas y maneja autenticación/autorización
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
      // Permitir acceso solo si está autenticado
      authorized: ({ token }) => !!token,
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
