import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signMobileToken } from '@/lib/auth-mobile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'Se requiere idToken de Google' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!googleResponse.ok) {
      return NextResponse.json(
        { error: 'Token de Google inválido' },
        { status: 401 }
      );
    }

    const googleUser = await googleResponse.json();

    if (!googleUser.email || !googleUser.email_verified) {
      return NextResponse.json(
        { error: 'Email de Google no verificado' },
        { status: 401 }
      );
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || 'Usuario',
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
          role: 'CLIENT',
          clientProfile: {
            create: {
              tags: [],
            },
          },
        },
      });
    }

    const token = signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en mobile-google:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
