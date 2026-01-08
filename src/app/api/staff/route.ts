import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        staffProfile: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
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
      bio: s.staffProfile?.bio || null,
      photoUrl: s.staffProfile?.photoUrl || null,
      specialties: s.staffProfile?.specialties || [],
      services: s.staffProfile?.services || [],
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
