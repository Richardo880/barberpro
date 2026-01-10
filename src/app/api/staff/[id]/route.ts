import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, role: "STAFF" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        staffProfile: {
          select: {
            id: true,
            bio: true,
            photoUrl: true,
            specialties: true,
            isActive: true,
            services: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Miembro del staff no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      staff: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.staffProfile?.bio || null,
        photoUrl: user.staffProfile?.photoUrl || null,
        specialties: user.staffProfile?.specialties || [],
        isActive: user.staffProfile?.isActive ?? true,
        services: user.staffProfile?.services || [],
        staffProfileId: user.staffProfile?.id || null,
      },
    });
  } catch (error) {
    console.error("Error al obtener staff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

const updateStaffSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  specialties: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateStaffSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y es staff
    const existingUser = await prisma.user.findUnique({
      where: { id, role: "STAFF" },
      include: { staffProfile: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Miembro del staff no encontrado" },
        { status: 404 }
      );
    }

    const { name, phone, bio, photoUrl, specialties, serviceIds, isActive } = validated.data;

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        staffProfile: {
          update: {
            ...(bio !== undefined && { bio: bio || null }),
            ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
            ...(specialties !== undefined && { specialties }),
            ...(isActive !== undefined && { isActive }),
            ...(serviceIds !== undefined && {
              services: {
                set: serviceIds.map(serviceId => ({ id: serviceId })),
              },
            }),
          },
        },
      },
      include: {
        staffProfile: {
          include: {
            services: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Staff actualizado exitosamente",
      staff: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.staffProfile?.bio,
        photoUrl: updatedUser.staffProfile?.photoUrl,
        specialties: updatedUser.staffProfile?.specialties,
        isActive: updatedUser.staffProfile?.isActive,
        services: updatedUser.staffProfile?.services,
      },
    });
  } catch (error) {
    console.error("Error al actualizar staff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el usuario existe y es staff
    const existingUser = await prisma.user.findUnique({
      where: { id, role: "STAFF" },
      include: {
        staffAppointments: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Miembro del staff no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene citas pendientes, solo desactivar
    if (existingUser.staffAppointments.length > 0) {
      await prisma.staffProfile.update({
        where: { userId: id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Staff desactivado (tiene citas pendientes)",
        deactivated: true,
      });
    }

    // Si no tiene citas pendientes, eliminar completamente
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Staff eliminado exitosamente",
      deleted: true,
    });
  } catch (error) {
    console.error("Error al eliminar staff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
