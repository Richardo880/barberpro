import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateAppointmentClientSchema,
  updateAppointmentAdminSchema,
} from "@/lib/validations/appointment";
import { addMinutes } from "date-fns";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
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
            description: true,
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

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    // Los clientes solo pueden ver sus propios turnos
    if (
      session.user.role === "CLIENT" &&
      appointment.clientId !== session.user.id
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error al obtener appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Verificar que el appointment existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { service: true },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    // Determinar si es cliente o admin/staff
    const isClient = session.user.role === "CLIENT";
    const isOwner = existingAppointment.clientId === session.user.id;

    // Los clientes solo pueden editar sus propios turnos
    if (isClient && !isOwner) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar según el rol
    const schema = isClient
      ? updateAppointmentClientSchema
      : updateAppointmentAdminSchema;

    const validated = schema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validated.error.errors },
        { status: 400 }
      );
    }

    let updateData: any = { ...validated.data };

    // Si admin cambia la hora, recalcular endTime
    if (updateData.startTime) {
      const newStartTime = new Date(updateData.startTime);
      updateData.endTime = addMinutes(
        newStartTime,
        existingAppointment.service.duration
      );
    }

    // Actualizar appointment
    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
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

    // Si el estado cambió a COMPLETED, crear automáticamente un registro de corte
    if (updateData.status === "COMPLETED" && existingAppointment.status !== "COMPLETED") {
      try {
        await prisma.haircutRecord.create({
          data: {
            clientId: updated.clientId,
            serviceId: updated.serviceId,
            staffId: updated.staffId,
            date: updated.startTime,
            price: updated.service.price,
            notes: updated.staffNotes || undefined,
            tags: [],
            photoUrls: [],
          },
        });
      } catch (recordError) {
        console.error("Error al crear registro de corte automático:", recordError);
        // No fallar la actualización del appointment si falla la creación del registro
      }
    }

    return NextResponse.json({
      message: "Turno actualizado exitosamente",
      appointment: updated,
    });
  } catch (error) {
    console.error("Error al actualizar appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo ADMIN/STAFF pueden borrar (hard delete)
    if (session.user.role === "CLIENT") {
      return NextResponse.json(
        { error: "No autorizado. Use PATCH para cancelar el turno" },
        { status: 403 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Turno eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
