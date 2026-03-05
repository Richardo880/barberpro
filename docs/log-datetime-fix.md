# Fix: Timezone y Disponibilidad de Horarios

**Fecha:** 2026-03-04

## Problemas detectados

### 1. Bug de timezone en slots disponibles
La API de available-slots devolvía las horas en UTC en vez de hora Paraguay (America/Asuncion). Esto causaba que si un barbero tenía una reserva a las 17:00 PY, el sistema mostraba que estaba ocupado a las 19:00 o 20:00 (dependiendo de la época del año, UTC-3 o UTC-4).

**Archivos afectados:**
- `src/app/api/appointments/available-slots/route.ts` (línea 46)
- `src/app/(dashboard)/mi-cuenta/nueva-reserva/page.tsx` (líneas 198-205)

**Causa raíz:**
```ts
// ANTES - extraía hora UTC directamente
const timeStr = slot.start.toISOString().split('T')[1].slice(0, 5);
```

**Fix aplicado en la API:**
```ts
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const zonedStart = toZonedTime(slot.start, 'America/Asuncion');
const timeStr = format(zonedStart, 'HH:mm');
```

**Fix aplicado en el frontend (creación de cita):**
```ts
// ANTES - usaba setHours con hora UTC pensando que era local
const [hours, minutes] = state.timeSlot.split(":").map(Number);
const appointmentDate = new Date(state.date);
appointmentDate.setHours(hours, minutes, 0, 0);

// DESPUÉS - construye la fecha en timezone Paraguay y convierte a UTC
import { fromZonedTime } from 'date-fns-tz';
import { parse } from 'date-fns';

const dateStr = format(state.date, 'yyyy-MM-dd');
const localDateTime = parse(`${dateStr} ${state.timeSlot}`, 'yyyy-MM-dd HH:mm', new Date());
const startTimeUTC = fromZonedTime(localDateTime, 'America/Asuncion');
```

---

### 2. Detección de conflictos demasiado agresiva (buffer pre-cita)
El sistema aplicaba un buffer de 10 minutos ANTES y DESPUÉS de cada cita existente. Esto causaba que si había una cita a las 17:00, un servicio de 60 min a las 16:00 (que termina a las 17:00) se marcaba como conflicto, impidiendo reservas back-to-back legítimas.

**Archivo afectado:**
- `src/server/services/availability.service.ts` (líneas 145-161)

**Causa raíz:**
```ts
// ANTES - buffer en ambas direcciones + isWithinInterval con bordes inclusivos
const aptStartWithBuffer = addMinutes(apt.startTime, -bufferMinutes);
const aptEndWithBuffer = addMinutes(apt.endTime, bufferMinutes);

return (
  isWithinInterval(slot.start, { start: aptStartWithBuffer, end: aptEndWithBuffer }) ||
  isWithinInterval(slot.end, { start: aptStartWithBuffer, end: aptEndWithBuffer }) ||
  isWithinInterval(aptStartWithBuffer, { start: slot.start, end: slot.end })
);
```

**Fix aplicado:**
```ts
// DESPUÉS - buffer solo post-cita + comparación estricta (<)
const aptEndWithBuffer = addMinutes(apt.endTime, bufferMinutes);
return isBefore(slot.start, aptEndWithBuffer) && isBefore(apt.startTime, slot.end);
```

**Cambio de comportamiento con cita a las 17:00-18:00 (buffer 10 min):**

| Slot (60 min) | Antes    | Después      | Razón                                    |
|---------------|----------|--------------|------------------------------------------|
| 16:00→17:00   | Bloqueado | Disponible  | Back-to-back válido (termina = empieza)  |
| 16:30→17:30   | Bloqueado | Bloqueado   | Se solapa con la cita                    |
| 17:00→18:00   | Bloqueado | Bloqueado   | Es la cita misma                         |
| 18:00→19:00   | Bloqueado | Bloqueado   | Dentro del buffer post (18:00 < 18:10)   |
| 18:30→19:30   | Disponible| Disponible  | Después del buffer (18:30 > 18:10)       |

---

### 3. Horarios de negocio incorrectos
El seed tenía horarios de cierre a las 18:00 (lun-jue), 19:00 (viernes) y 14:00 (sábado). El usuario necesitaba poder reservar hasta las 20:00 todos los días (última reserva a las 20:00, cierre real a las 21:00).

**Archivo afectado:**
- `src/db/seed.ts`

**Cambio:**
```ts
// ANTES
{ dayOfWeek: DayOfWeek.MONDAY,    closeTime: '18:00' },
{ dayOfWeek: DayOfWeek.FRIDAY,    closeTime: '19:00' },
{ dayOfWeek: DayOfWeek.SATURDAY,  openTime: '08:00', closeTime: '14:00' },

// DESPUÉS - Lunes a Sábado uniformes
{ dayOfWeek: DayOfWeek.MONDAY,    closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.TUESDAY,   closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.WEDNESDAY, closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.THURSDAY,  closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.FRIDAY,    closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.SATURDAY,  openTime: '09:00', closeTime: '21:00' },
{ dayOfWeek: DayOfWeek.SUNDAY,    isOpen: false },
```

Con servicio de 60 min → última reserva posible: **20:00** (termina 21:00 = cierre).

---

## Tests agregados

### `src/server/services/__tests__/availability.service.test.ts`

#### Bloque: "booking conflict scenarios" (8 tests)
Escenario base: Viernes, servicio 60 min, horario 09:00-18:00, cita existente a las 17:00.

- User A reserva 17:00 sin citas previas → disponible
- User B ve 17:00 ocupado tras reserva de A → bloqueado
- 17:00 es el último slot con cierre 18:00 (17:30 no existe)
- 16:30 ocupado (60 min terminaría a 17:30, solapa con cita)
- 16:00 disponible (back-to-back: termina 17:00 = empieza cita)
- 15:30 disponible (termina 16:30, antes de la cita)
- Slots de mañana no afectados
- Citas PENDING también bloquean slots

#### Bloque: "booking with extended hours" (3 tests)
Escenario: Viernes, servicio 60 min, horario 09:00-21:00.

- Genera slots hasta 20:00 (20:30 no existe)
- Tras cita 17:00-18:00: 18:00 bloqueado (buffer), 18:30 y 19:00 disponibles
- Tras cita 17:30-18:30: 18:30 bloqueado (buffer), 19:00 disponible

#### Bloque: "full day booking simulation" (8 tests)
Simula llenar un lunes completo (09:00-21:00) con servicio de 60 min.

1. **Día vacío**: 23 slots disponibles (09:00-20:00 cada 30 min)
2. **Reservar 10:00**: 10:00/10:30 bloqueados, 09:00 libre (back-to-back), 11:30 libre
3. **Reservar 10:00 + 14:00**: ambos bloqueados, 12:00 libre entre ellos
4. **Intentar 10:30 con 10:00 ocupado**: conflicto detectado
5. **5 citas distribuidas**: verifica gaps libres (13:00, 16:00 back-to-back, 18:30, 19:00, 20:00)
6. **Día completo lleno**: 12 citas back-to-back (09-21), 0 slots disponibles
7. **Gap ajustado**: 10:00-11:00 y 12:00-13:00 → gap insuficiente para 60 min
8. **Gap suficiente**: 10:00-11:00 y 13:00-14:00 → 11:30 y 12:00 disponibles

### `src/app/api/appointments/available-slots/__tests__/route.test.ts`
- Actualizado test existente: ahora espera hora Paraguay (`09:00`) en vez de UTC (`12:00`)

---

## Resultado final

```
Test Files  29 passed (29)
     Tests  462 passed (462)
```

## Para aplicar en la base de datos

```bash
npm run db:seed
```

O SQL directo:
```sql
UPDATE "BusinessHours"
SET "openTime" = '09:00', "closeTime" = '21:00'
WHERE "dayOfWeek" IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY');
```
