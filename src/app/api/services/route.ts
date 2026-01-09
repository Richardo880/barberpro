import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  duration: z.number().int().min(5, "La duración mínima es 5 minutos"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  imageUrl: z.string().url("La URL de la imagen debe ser válida").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get("active");

    // Por defecto, solo retornar servicios activos
    const active = activeParam === "false" ? false : true;

    const services = await prisma.service.findMany({
      where: active ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        imageUrl: true,
        isActive: true,
      },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
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

    // Solo ADMIN o STAFF pueden crear servicios
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createServiceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: validated.data,
    });

    return NextResponse.json({
      message: "Servicio creado exitosamente",
      service,
    });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
