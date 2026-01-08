import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos con Zod
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return NextResponse.json(
        {
          error: firstError.message || "Datos inválidos",
          details: validated.error.errors
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validated.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado. Por favor usa otro email o inicia sesión." },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario con ClientProfile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "CLIENT",
        clientProfile: {
          create: {
            tags: [],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en registro:", error);

    // Error de Prisma para unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // Error de conexión a la base de datos
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: "No se pudo conectar a la base de datos. Intenta nuevamente." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la cuenta. Por favor intenta nuevamente." },
      { status: 500 }
    );
  }
}
