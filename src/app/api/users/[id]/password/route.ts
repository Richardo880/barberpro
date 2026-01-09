import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Los usuarios solo pueden cambiar su propia contraseña
    if (session.user.id !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar datos
    const validated = changePasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validated.data;

    // Obtener usuario con password
    const user = await prisma.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 401 }
      );
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
