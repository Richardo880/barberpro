/**
 * API Route: GET Available Slots
 * POST /api/appointments/available-slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/server/services/availability.service';
import { z } from 'zod';

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
        // Extraer solo la hora en formato HH:mm
        const timeStr = slot.start.toISOString().split('T')[1].slice(0, 5);
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
