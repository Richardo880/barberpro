import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    // Si es un cliente, solo puede ver sus propios records
    const whereClause: any = {};
    if (session.user.role === "CLIENT") {
      whereClause.clientId = session.user.id;
    } else if (clientId) {
      // Admin o staff pueden filtrar por clientId
      whereClause.clientId = clientId;
    }

    const records = await prisma.haircutRecord.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
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

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error al obtener records:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo ADMIN o STAFF pueden crear records
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, serviceId, staffId, date, price, notes, tags, photoUrls } = body;

    // Validaciones básicas
    if (!clientId || !serviceId || !date || !price) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clientId, serviceId, date, price" },
        { status: 400 }
      );
    }

    const record = await prisma.haircutRecord.create({
      data: {
        clientId,
        serviceId,
        staffId: staffId || session.user.id,
        date: new Date(date),
        price,
        notes: notes || null,
        tags: tags || [],
        photoUrls: photoUrls || [],
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
      message: "Record creado exitosamente",
      record,
    });
  } catch (error) {
    console.error("Error al crear record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
