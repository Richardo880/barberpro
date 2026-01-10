import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Si includeInactive es true, verificar que sea admin
    if (includeInactive) {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
    }

    const staff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        ...(includeInactive ? {} : {
          staffProfile: {
            isActive: true,
          },
        }),
      },
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
      orderBy: { name: "asc" },
    });

    // Transformar para aplanar el perfil
    const formattedStaff = staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      bio: s.staffProfile?.bio || null,
      photoUrl: s.staffProfile?.photoUrl || null,
      specialties: s.staffProfile?.specialties || [],
      isActive: s.staffProfile?.isActive ?? true,
      services: s.staffProfile?.services || [],
      staffProfileId: s.staffProfile?.id || null,
    }));

    return NextResponse.json({ staff: formattedStaff });
  } catch (error) {
    console.error("Error al obtener staff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

const createStaffSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  specialties: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createStaffSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, phone, bio, photoUrl, specialties, serviceIds } = validated.data;

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario y perfil de staff
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: "STAFF",
        staffProfile: {
          create: {
            bio: bio || null,
            photoUrl: photoUrl || null,
            specialties: specialties || [],
            isActive: true,
            ...(serviceIds && serviceIds.length > 0 ? {
              services: {
                connect: serviceIds.map(id => ({ id })),
              },
            } : {}),
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
      message: "Miembro del staff creado exitosamente",
      staff: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.staffProfile?.bio,
        photoUrl: user.staffProfile?.photoUrl,
        specialties: user.staffProfile?.specialties,
        isActive: user.staffProfile?.isActive,
        services: user.staffProfile?.services,
      },
    });
  } catch (error) {
    console.error("Error al crear staff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
