import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import { authOptions } from './auth';

export interface MobileSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export function signMobileToken(payload: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyMobileToken(token: string): MobileSession['user'] | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileSession['user'];
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Gets the session from either a Bearer token (mobile) or NextAuth cookies (web).
 * Use this in API routes that need to support both mobile and web clients.
 */
export async function getSessionFromRequest(request?: NextRequest): Promise<MobileSession | null> {
  // Check for Bearer token first (mobile clients)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const user = verifyMobileToken(token);
      if (user) {
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }
      return null;
    }
  }

  // Fall back to NextAuth session (web clients)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        role: session.user.role,
      },
    };
  }

  return null;
}
