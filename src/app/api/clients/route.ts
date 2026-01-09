import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientQuerySchema } from "@/lib/validations/user";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admin/staff pueden listar clientes
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validar query params
    const validated = clientQuerySchema.safeParse(queryParams);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { search, page, limit } = validated.data;

    // Construir filtro de búsqueda
    const where: any = {
      role: "CLIENT",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Consultar clientes
    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          createdAt: true,
          clientProfile: {
            select: {
              tags: true,
              preferredStaffId: true,
            },
          },
          _count: {
            select: {
              appointments: true,
            },
          },
          appointments: {
            take: 1,
            orderBy: { startTime: "desc" },
            select: {
              id: true,
              startTime: true,
              status: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
