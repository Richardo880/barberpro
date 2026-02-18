import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";
import {
  createAppointmentSchema,
  appointmentQuerySchema,
} from "@/lib/validations/appointment";
import { addMinutes } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validar query params
    const validated = appointmentQuerySchema.safeParse(queryParams);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { status, clientId, staffId, date, from, to, page, limit } = validated.data;

    // Construir filtros según el rol
    const where: any = {};

    // Clientes solo ven sus propios turnos
    if (session.user.role === "CLIENT") {
      where.clientId = session.user.id;
    }

    // Filtros opcionales
    if (clientId && session.user.role !== "CLIENT") {
      where.clientId = clientId;
    }
    if (staffId) {
      where.staffId = staffId;
    }
    if (status) {
      // Si es un array, usar "in", si es un string, usar igualdad directa
      where.status = Array.isArray(status) ? { in: status } : status;
    }
    if (date) {
      // Filtrar por fecha específica (todo el día)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Consultar appointments con datos relacionados
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
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
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener appointments:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos
    const validated = createAppointmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { serviceId, staffId, startTime, clientNotes } = validated.data;

    // Obtener duración del servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true, isActive: true },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "Servicio no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const startDate = new Date(startTime);
    const endDate = addMinutes(startDate, service.duration);

    // Verificar disponibilidad (no hay conflictos con otros appointments)
    const conflicts = await prisma.appointment.findMany({
      where: {
        staffId: staffId || undefined,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gt: startDate } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endDate } },
              { endTime: { gte: endDate } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "El horario seleccionado no está disponible" },
        { status: 409 }
      );
    }

    // Crear appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId: session.user.id,
        serviceId,
        staffId: staffId || null,
        startTime: startDate,
        endTime: endDate,
        clientNotes: clientNotes || null,
        status: "PENDING",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
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

    return NextResponse.json(
      {
        message: "Turno reservado exitosamente",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
