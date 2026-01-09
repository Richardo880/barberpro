import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/user";

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

    // Los usuarios solo pueden actualizar su propio perfil (excepto admins)
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar datos
    const validated = updateProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { name, phone, birthDate } = validated.data;

    // Actualizar usuario
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      user: updated,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
