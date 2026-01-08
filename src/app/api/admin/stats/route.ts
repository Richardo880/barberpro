import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo admin/staff pueden ver estadísticas
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Turnos de hoy
    const appointmentsToday = await prisma.appointment.count({
      where: {
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Turnos pendientes (global)
    const appointmentsPending = await prisma.appointment.count({
      where: {
        status: "PENDING",
      },
    });

    // Ingresos del mes (turnos completados)
    const completedAppointmentsThisMonth = await prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    const monthlyRevenue = completedAppointmentsThisMonth.reduce(
      (sum, apt) => sum + Number(apt.service.price),
      0
    );

    // Clientes nuevos este mes
    const newClientsThisMonth = await prisma.user.count({
      where: {
        role: "CLIENT",
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Total de clientes
    const totalClients = await prisma.user.count({
      where: {
        role: "CLIENT",
      },
    });

    // Próximos turnos de hoy
    const upcomingToday = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: todayEnd,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      take: 10,
      orderBy: {
        startTime: "asc",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        appointmentsToday,
        appointmentsPending,
        monthlyRevenue,
        newClientsThisMonth,
        totalClients,
      },
      upcomingToday,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
