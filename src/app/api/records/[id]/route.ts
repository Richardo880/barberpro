import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const record = await prisma.haircutRecord.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Record no encontrado" },
        { status: 404 }
      );
    }

    // Si es cliente, solo puede ver sus propios records
    if (session.user.role === "CLIENT" && record.clientId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error al obtener record:", error);
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

    // Solo ADMIN o STAFF pueden actualizar records
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { notes, tags, photoUrls } = body;

    const record = await prisma.haircutRecord.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(photoUrls !== undefined && { photoUrls }),
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Record actualizado exitosamente",
      record,
    });
  } catch (error) {
    console.error("Error al actualizar record:", error);
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

    // Solo ADMIN puede eliminar records
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.haircutRecord.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Record eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
