import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Admin/staff pueden ver cualquier cliente, clientes solo pueden verse a sí mismos
    if (session.user.role === "CLIENT" && session.user.id !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const client = await prisma.user.findUnique({
      where: { id, role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        createdAt: true,
        clientProfile: {
          select: {
            internalNotes: true,
            tags: true,
            preferredStaffId: true,
          },
        },
        appointments: {
          orderBy: { startTime: "desc" },
          take: 10,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        records: {
          orderBy: { date: "desc" },
          take: 10,
          select: {
            id: true,
            date: true,
            price: true,
            tags: true,
            service: {
              select: {
                id: true,
                name: true,
              },
            },
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error al obtener cliente:", error);
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admin/staff pueden actualizar cliente profile
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { internalNotes, tags, preferredStaffId } = body;

    // Verificar que el cliente existe
    const client = await prisma.user.findUnique({
      where: { id, role: "CLIENT" },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar ClientProfile
    const updated = await prisma.clientProfile.update({
      where: { userId: id },
      data: {
        ...(internalNotes !== undefined && { internalNotes }),
        ...(tags !== undefined && { tags }),
        ...(preferredStaffId !== undefined && { preferredStaffId }),
      },
    });

    return NextResponse.json({
      message: "Perfil del cliente actualizado exitosamente",
      clientProfile: updated,
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
