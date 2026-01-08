/**
 * Validaciones Zod para HaircutRecords
 */

import { z } from 'zod';

// Schema para crear registro
export const createRecordSchema = z.object({
  clientId: z.string().cuid({ message: 'ID de cliente inválido' }),
  serviceId: z.string().cuid({ message: 'ID de servicio inválido' }),
  staffId: z.string().cuid({ message: 'ID de staff inválido' }).optional(),
  date: z.string().datetime({ message: 'Fecha/hora inválida (debe ser ISO8601)' }),
  price: z
    .number()
    .positive({ message: 'El precio debe ser positivo' })
    .max(10000000, { message: 'El precio no puede exceder 10,000,000' }),
  notes: z
    .string()
    .max(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
    .optional(),
  tags: z.array(z.string()).optional(),
  photoUrls: z.array(z.string().url({ message: 'URL de foto inválida' })).optional(),
});

// Schema para query de records
export const recordQuerySchema = z.object({
  clientId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
