/**
 * Availability Service
 * Maneja lógica de disponibilidad de slots para reservas
 */

import { prisma } from '@/lib/prisma';
import {
  addMinutes,
  format,
  parse,
  isBefore,
  isAfter,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Asuncion'; // Paraguay timezone
const SLOT_INTERVAL_MINUTES = 30;

interface AvailabilityInput {
  serviceId: string;
  staffId?: string;
  date: string; // YYYY-MM-DD
}

interface Slot {
  start: Date;
  end: Date;
  available: boolean;
}

export class AvailabilityService {
  /**
   * Obtiene buffer time desde configuración
   */
  private async getBufferMinutes(): Promise<number> {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'buffer_time_minutes' },
    });
    return config ? parseInt(config.value) : 10; // Default 10 minutos
  }

  /**
   * Calcula slots disponibles para un día específico
   */
  async getAvailableSlots(input: AvailabilityInput): Promise<Slot[]> {
    // 1. Obtener servicio (para duración)
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    const serviceDuration = service.duration;

    // 2. Parsear fecha y obtener día de la semana
    const dateStr = input.date;
    const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    const dayOfWeek = format(parsedDate, 'EEEE').toUpperCase() as any;

    // 3. Obtener horarios de atención
    const businessHours = await prisma.businessHours.findUnique({
      where: { dayOfWeek },
    });

    if (!businessHours || !businessHours.isOpen) {
      return []; // Cerrado ese día
    }

    // 4. Verificar cierres excepcionales
    const closure = await prisma.closure.findFirst({
      where: {
        date: parsedDate,
        isAllDay: true,
      },
    });

    if (closure) {
      return []; // Cerrado por feriado/vacaciones
    }

    // 5. Generar slots base
    const openTime = parse(businessHours.openTime, 'HH:mm', parsedDate);
    const closeTime = parse(businessHours.closeTime, 'HH:mm', parsedDate);

    const slots: Slot[] = [];
    let currentSlot = openTime;

    while (isBefore(currentSlot, closeTime)) {
      const slotEnd = addMinutes(currentSlot, serviceDuration);

      // No permitir slots que terminen después del cierre
      if (isAfter(slotEnd, closeTime)) {
        break;
      }

      // Convertir a UTC para consistencia con DB
      const slotStartUTC = fromZonedTime(currentSlot, TIMEZONE);
      const slotEndUTC = fromZonedTime(slotEnd, TIMEZONE);

      slots.push({
        start: slotStartUTC,
        end: slotEndUTC,
        available: true,
      });

      currentSlot = addMinutes(currentSlot, SLOT_INTERVAL_MINUTES);
    }

    // 6. Obtener turnos existentes
    const dayStart = fromZonedTime(startOfDay(parsedDate), TIMEZONE);
    const dayEnd = fromZonedTime(endOfDay(parsedDate), TIMEZONE);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: dayStart,
          lt: dayEnd,
        },
        staffId: input.staffId || undefined,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    // 7. Obtener buffer
    const bufferMinutes = await this.getBufferMinutes();

    // 8. Marcar slots no disponibles
    const now = new Date();

    slots.forEach((slot) => {
      // Filtrar slots pasados
      if (isBefore(slot.start, now)) {
        slot.available = false;
        return;
      }

      // Verificar conflictos con turnos existentes
      // Dos rangos [slotStart, slotEnd) y [aptStart, aptEnd + buffer) se solapan
      // si slotStart < aptEnd+buffer AND aptStart < slotEnd (comparación estricta)
      const hasConflict = existingAppointments.some((apt) => {
        const aptEndWithBuffer = addMinutes(apt.endTime, bufferMinutes);

        return isBefore(slot.start, aptEndWithBuffer) && isBefore(apt.startTime, slot.end);
      });

      if (hasConflict) {
        slot.available = false;
      }
    });

    return slots;
  }

  /**
   * Valida si un slot específico está disponible
   * Usar antes de crear una reserva (double-check)
   */
  async validateSlot(
    serviceId: string,
    staffId: string | null,
    startTime: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. Verificar que el servicio exista
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { valid: false, reason: 'Servicio no encontrado' };
    }

    const endTime = addMinutes(startTime, service.duration);
    const now = new Date();

    // 2. No permitir reservas en el pasado
    if (isBefore(startTime, now)) {
      return { valid: false, reason: 'No se pueden hacer reservas en el pasado' };
    }

    // 3. Verificar horario de atención
    const zonedStart = toZonedTime(startTime, TIMEZONE);
    const dayOfWeek = format(zonedStart, 'EEEE').toUpperCase() as any;

    const businessHours = await prisma.businessHours.findUnique({
      where: { dayOfWeek },
    });

    if (!businessHours || !businessHours.isOpen) {
      return { valid: false, reason: 'El local está cerrado ese día' };
    }

    const openTime = parse(businessHours.openTime, 'HH:mm', zonedStart);
    const closeTime = parse(businessHours.closeTime, 'HH:mm', zonedStart);

    if (isBefore(zonedStart, openTime) || isAfter(endTime, closeTime)) {
      return { valid: false, reason: 'Fuera del horario de atención' };
    }

    // 4. Verificar cierres
    const closure = await prisma.closure.findFirst({
      where: {
        date: parse(format(zonedStart, 'yyyy-MM-dd'), 'yyyy-MM-dd', new Date()),
        isAllDay: true,
      },
    });

    if (closure) {
      return { valid: false, reason: `Cerrado por ${closure.reason}` };
    }

    // 5. Verificar conflictos
    const conflicts = await prisma.appointment.findMany({
      where: {
        staffId: staffId || undefined,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return { valid: false, reason: 'Slot ya ocupado' };
    }

    return { valid: true };
  }

  /**
   * Obtiene próximos slots disponibles (útil para "sugerir horarios")
   */
  async getNextAvailableSlots(
    serviceId: string,
    staffId?: string,
    limit = 5
  ): Promise<Slot[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const slots = await this.getAvailableSlots({ serviceId, staffId, date: today });

    const availableSlots = slots.filter((s) => s.available);

    // Si no hay slots hoy, buscar mañana
    if (availableSlots.length < limit) {
      const tomorrow = format(addMinutes(new Date(), 24 * 60), 'yyyy-MM-dd');
      const tomorrowSlots = await this.getAvailableSlots({
        serviceId,
        staffId,
        date: tomorrow,
      });
      availableSlots.push(...tomorrowSlots.filter((s) => s.available));
    }

    return availableSlots.slice(0, limit);
  }
}
