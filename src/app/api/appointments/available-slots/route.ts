/**
 * API Route: GET Available Slots
 * POST /api/appointments/available-slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/server/services/availability.service';
import { z } from 'zod';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const TIMEZONE = 'America/Asuncion';

const requestSchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar input
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { serviceId, staffId, date } = validated.data;

    // Obtener slots disponibles
    const availabilityService = new AvailabilityService();
    const slots = await availabilityService.getAvailableSlots({
      serviceId,
      staffId,
      date,
    });

    return NextResponse.json({
      slots: slots.map((slot) => {
        // Convertir UTC a hora Paraguay para mostrar al usuario
        const zonedStart = toZonedTime(slot.start, TIMEZONE);
        const timeStr = format(zonedStart, 'HH:mm');
        return {
          time: timeStr,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          available: slot.available,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);

    return NextResponse.json(
      {
        error: 'Error al obtener horarios disponibles',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
