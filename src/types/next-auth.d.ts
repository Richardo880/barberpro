/**
 * TypeScript types extension for NextAuth
 * Extiende los tipos de NextAuth para incluir role en session y JWT
 */

import { DefaultSession, DefaultUser } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  /**
   * Session extendida con role
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  /**
   * User extendido con role
   */
  interface User extends DefaultUser {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT extendido con role
   */
  interface JWT {
    id: string;
    role: Role;
  }
}
