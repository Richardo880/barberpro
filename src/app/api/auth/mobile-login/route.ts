import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations/user';
import { signMobileToken } from '@/lib/auth-mobile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Esta cuenta usa Google para iniciar sesión' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
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
    console.error('Error en mobile-login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
