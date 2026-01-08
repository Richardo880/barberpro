/**
 * NextAuth Configuration
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const validated = loginSchema.safeParse(credentials);
          if (!validated.success) return null;

          const { email, password } = validated.data;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          // Si el usuario no tiene passwordHash (registrado con OAuth), no puede hacer login con credenciales
          if (!user.passwordHash) {
            console.error('User registered with OAuth, cannot login with credentials');
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);

          if (!isValidPassword) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    // OAuth Google (opcional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Primer login
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // OAuth: buscar o crear usuario
      if (account?.provider === 'google' && user?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.role = existingUser.role;
        } else {
          // Crear usuario nuevo desde Google con ClientProfile
          try {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || 'Usuario',
                passwordHash: await bcrypt.hash(Math.random().toString(36), 12), // Password aleatorio para OAuth
                role: 'CLIENT',
                clientProfile: {
                  create: {
                    tags: [],
                  },
                },
              },
            });
            token.id = newUser.id;
            token.role = newUser.role;
          } catch (error) {
            console.error('Error creating OAuth user:', error);
            // Si falla la creación, no autenticar
            return token;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
