import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateServiceSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  description: z.string().optional(),
  duration: z.number().int().min(5, "La duración mínima es 5 minutos").optional(),
  price: z.number().min(0, "El precio no puede ser negativo").optional(),
  imageUrl: z.string().url("La URL de la imagen debe ser válida").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    // Solo ADMIN o STAFF pueden actualizar servicios
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateServiceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.errors },
        { status: 400 }
      );
    }

    // Verificar que el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: validated.data,
    });

    return NextResponse.json({
      message: "Servicio actualizado exitosamente",
      service,
    });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
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
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo ADMIN puede eliminar servicios
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el servicio existe
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si hay appointments asociados
    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId: id },
    });

    if (appointmentsCount > 0) {
      // No eliminar, solo desactivar
      const service = await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "El servicio tiene turnos asociados y ha sido desactivado en lugar de eliminado",
        service,
      });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Servicio eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
