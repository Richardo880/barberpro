/**
 * Validaciones Zod para Appointments
 */

import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

// Schema para obtener slots disponibles
export const availabilitySlotsSchema = z.object({
  serviceId: z.string().cuid({ message: 'ID de servicio inválido' }),
  staffId: z.string().cuid({ message: 'ID de staff inválido' }).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha debe ser YYYY-MM-DD' }),
});

// Schema para crear appointment
export const createAppointmentSchema = z.object({
  serviceId: z.string().cuid({ message: 'ID de servicio inválido' }),
  staffId: z.string().cuid({ message: 'ID de staff inválido' }).optional().nullable(),
  startTime: z.string().datetime({ message: 'Fecha/hora de inicio inválida (debe ser ISO8601)' }),
  clientNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden exceder 500 caracteres' })
    .optional(),
  paymentProofUrl: z.string().url({ message: 'URL de comprobante inválida' }).optional(),
});

// Schema para actualizar appointment (cliente)
export const updateAppointmentClientSchema = z.object({
  clientNotes: z
    .string()
    .max(500, { message: 'Las notas no pueden exceder 500 caracteres' })
    .optional(),
  status: z
    .enum([AppointmentStatus.CANCELLED])
    .optional(),
});

// Schema para actualizar appointment (admin/staff)
export const updateAppointmentAdminSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  staffId: z.string().cuid().optional().nullable(),
  startTime: z.string().datetime().optional(),
  clientNotes: z.string().max(500).optional(),
  staffNotes: z.string().max(1000).optional(),
  paymentStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

// Schema para query params de appointments
export const appointmentQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      // Si viene separado por comas, convertir a array
      const statuses = val.split(',').map(s => s.trim());
      // Validar que todos los valores sean válidos
      const validStatuses = statuses.filter(s =>
        Object.values(AppointmentStatus).includes(s as AppointmentStatus)
      );
      return validStatuses.length > 0 ? validStatuses : undefined;
    }),
  clientId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
  date: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
