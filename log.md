# Session Log - 2026-01-31

## 1. Test Fixes

### Initial State
- 6 test files with 68 tests total
- 24 tests failing

### Issues Fixed

#### Integration Tests (`register.integration.test.ts`)
- **Problem**: Tests used `fetch("http://localhost:3000/...")` requiring a running server
- **Solution**: Converted to unit tests with mocked Prisma and bcrypt

#### Appointments Route Tests (`route.test.ts`)
- **Problem**: Missing `authOptions` mock, incorrect status filter format, invalid CUID IDs
- **Solution**:
  - Added `vi.mock("@/lib/auth", () => ({ authOptions: {} }))`
  - Changed status expectation from string to array format `{ in: ["PENDING"] }`
  - Used valid CUIDs from mockData

#### useAppointments Hook Tests (`use-appointments.test.tsx`)
- **Problem**: `useAvailableSlots` signature mismatch - tests passed object but hook uses individual params
- **Solution**: Updated tests to use individual parameters `(serviceId, date, staffId)`

#### Login and Registration Tests
- **Problem**: Zod v4 + react-hook-form compatibility issue causing unhandled rejections
- **Solution**: Upgraded `@hookform/resolvers` from v3.10.0 to v5.2.2 (GitHub Issue #12816)

### Final State
- All 68 tests passing

---

## 2. Promotional Discount Feature

### Problem
When a promo day discount was applied, the client history showed the original service price instead of the discounted price.

### Root Cause
In `/api/appointments/[id]/route.ts`, when creating a `HaircutRecord` on appointment completion, the code used `updated.service.price` (original price) instead of calculating the discounted price.

### Solution Implemented

#### Database Schema Changes
Added audit fields to `HaircutRecord` model in `src/db/schema.prisma`:
```prisma
model HaircutRecord {
  // ... existing fields ...
  originalPrice    Decimal?  @db.Decimal(10, 2)
  discountAmount   Decimal?  @db.Decimal(10, 2)
  promotionApplied Boolean   @default(false)
}
```

#### New Service Created
`/src/server/services/promotion.service.ts`:
- `getPromotionConfig()` - Fetches promo settings from AppConfig table
- `isPromoDayForDate()` - Checks if a date is a promo day
- `calculatePrice()` - Calculates price with discount
- `calculatePriceWithPromotion()` - Convenience function combining config fetch and calculation

#### API Routes Updated

**`/src/app/api/appointments/[id]/route.ts`**:
- When status changes to COMPLETED, now calculates discounted price using promotion service
- Stores `price`, `originalPrice`, `discountAmount`, and `promotionApplied` in HaircutRecord

**`/src/app/api/records/route.ts`**:
- POST endpoint now supports new audit fields for manual record creation
- Calculates discount fields automatically if not provided

#### UI Pages Updated (3 files)

All pages now display promotional discounts with:
- Discounted price in bold green
- Original price with strikethrough
- Green "Promo" badge with tag icon

1. `/src/app/(dashboard)/mi-cuenta/historial/page.tsx`
2. `/src/app/(dashboard)/mi-cuenta/page.tsx`
3. `/src/app/admin/clientes/[id]/page.tsx`

### Files Modified
- `src/db/schema.prisma`
- `src/server/services/promotion.service.ts` (new)
- `src/app/api/appointments/[id]/route.ts`
- `src/app/api/records/route.ts`
- `src/app/(dashboard)/mi-cuenta/historial/page.tsx`
- `src/app/(dashboard)/mi-cuenta/page.tsx`
- `src/app/admin/clientes/[id]/page.tsx`

### Verification
- All 68 tests passing
- TypeScript compilation successful for main code (pre-existing test type issues remain)

---

## 3. Tests para Promotional Discount Feature

### Archivos Creados

#### `src/server/services/__tests__/promotion.service.test.ts` - 15 tests

**`isPromoDayForDate()`** - 4 tests:
- Retorna true cuando fecha coincide con día de promo y está habilitado
- Retorna false cuando fecha no coincide
- Retorna false cuando promo está deshabilitado
- Maneja diferentes días de promo correctamente

**`calculatePrice()`** - 6 tests:
- Aplica descuento en día de promo con servicio elegible
- No aplica descuento cuando servicio no está en lista
- No aplica descuento en día sin promo
- No aplica descuento cuando promo está deshabilitado
- Limita descuento al precio original (sin precios negativos)
- Maneja servicio con precio cero

**`getPromotionConfig()`** - 3 tests:
- Retorna configuración desde base de datos
- Retorna valores por defecto cuando no hay config
- Maneja configuración parcial

**`calculatePriceWithPromotion()`** - 2 tests:
- Obtiene config y calcula precio con promo
- Retorna precio original sin config de promo

#### `src/app/api/appointments/[id]/__tests__/route.test.ts` - 7 tests

- Crea record con precio descontado al completar en día de promo
- Crea record con precio original en día sin promo
- No crea record cuando status no es COMPLETED
- No crea record duplicado cuando ya está COMPLETED
- Actualiza appointment aunque falle creación de record
- Retorna 401 si no autenticado
- Retorna 404 si appointment no existe

---

## 4. Tests para Availability Service

### Archivos Creados

#### `src/server/services/__tests__/availability.service.test.ts` - 22 tests

**`getAvailableSlots()`** - 9 tests:
- Retorna slots basados en horarios de negocio
- Retorna array vacío cuando está cerrado ese día
- Retorna array vacío cuando no hay horarios configurados
- Retorna array vacío con cierre excepcional (feriado)
- Lanza error cuando servicio no existe
- Marca slots pasados como no disponibles
- Marca slots con conflictos como no disponibles
- Filtra por staffId cuando se proporciona
- Respeta buffer time desde configuración
- No genera slots que terminen después del cierre

**`validateSlot()`** - 8 tests:
- Retorna válido para slot disponible
- Retorna inválido cuando servicio no existe
- Retorna inválido para tiempos pasados
- Retorna inválido cuando negocio está cerrado
- Retorna inválido con cierre excepcional
- Retorna inválido cuando hay conflicto con turno existente
- Retorna inválido fuera de horario de atención
- Valida con staffId específico

**`getNextAvailableSlots()`** - 4 tests:
- Retorna número limitado de slots disponibles
- Busca en día siguiente si no hay suficientes hoy
- Filtra por staffId cuando se proporciona
- Retorna array vacío cuando no hay slots disponibles

#### `src/app/api/appointments/available-slots/__tests__/route.test.ts` - 8 tests

- Retorna slots disponibles para request válido
- Pasa staffId al servicio cuando se proporciona
- Retorna 400 para serviceId faltante
- Retorna 400 para date faltante
- Retorna 400 para formato de fecha inválido
- Retorna 400 para serviceId inválido (no CUID)
- Retorna 500 cuando el servicio lanza error
- Retorna array vacío cuando no hay slots disponibles

---

## 5. Tests para Records API

### Archivos Creados

#### `src/app/api/records/__tests__/route.test.ts` - 18 tests

**GET /api/records** - 7 tests:
- Retorna 401 si no autenticado
- Retorna records para cliente autenticado (solo propios)
- Retorna todos los records para admin sin filtro
- Permite a admin filtrar por clientId
- Ordena records por fecha descendente
- Incluye service y staff en respuesta
- Retorna 500 en error de base de datos

**POST /api/records** - 11 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta crear record
- Retorna 400 si faltan campos requeridos
- Crea record exitosamente para admin
- Crea record exitosamente para staff
- Usa session user como staffId si no se proporciona
- Usa staffId proporcionado cuando se da
- Calcula campos de promoción automáticamente cuando precio es menor
- Usa campos de promoción proporcionados cuando se dan
- Maneja campos opcionales (notes, tags, photoUrls)
- Retorna 500 en error de base de datos

#### `src/app/api/records/[id]/__tests__/route.test.ts` - 21 tests

**GET /api/records/[id]** - 8 tests:
- Retorna 401 si no autenticado
- Retorna 404 si record no existe
- Retorna 403 si cliente intenta acceder record de otro cliente
- Retorna record para cliente accediendo a su propio record
- Retorna record para admin accediendo cualquier record
- Retorna record para staff accediendo cualquier record
- Incluye service, staff y client en respuesta
- Retorna 500 en error de base de datos

**PATCH /api/records/[id]** - 8 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta actualizar record
- Actualiza notes exitosamente para admin
- Actualiza tags exitosamente para staff
- Actualiza photoUrls exitosamente
- Actualiza múltiples campos a la vez
- No actualiza campos no proporcionados en request
- Retorna 500 en error de base de datos

**DELETE /api/records/[id]** - 5 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta eliminar record
- Retorna 403 si staff intenta eliminar record
- Elimina record exitosamente para admin
- Retorna 500 en error de base de datos

---

## 6. Tests para Services API

### Archivos Creados

#### `src/app/api/services/__tests__/route.test.ts` - 17 tests

**GET /api/services** - 5 tests:
- Retorna servicios activos por defecto (sin autenticación requerida)
- Retorna todos los servicios cuando active=false
- Ordena servicios por nombre ascendente
- Selecciona solo campos requeridos
- Retorna 500 en error de base de datos

**POST /api/services** - 12 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta crear servicio
- Crea servicio exitosamente para admin
- Crea servicio exitosamente para staff
- Retorna 400 si nombre es muy corto (< 3 caracteres)
- Retorna 400 si duración es menor a 5 minutos
- Retorna 400 si precio es negativo
- Retorna 400 si imageUrl es URL inválida
- Acepta string vacío para imageUrl
- Acepta imageUrl válida
- Establece isActive=true por defecto
- Retorna 500 en error de base de datos

#### `src/app/api/services/[id]/__tests__/route.test.ts` - 25 tests

**GET /api/services/[id]** - 3 tests:
- Retorna servicio por id (sin autenticación requerida)
- Retorna 404 si servicio no existe
- Retorna 500 en error de base de datos

**PATCH /api/services/[id]** - 14 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta actualizar
- Retorna 404 si servicio no existe
- Actualiza servicio exitosamente para admin
- Actualiza servicio exitosamente para staff
- Actualiza name exitosamente
- Actualiza price exitosamente
- Actualiza duration exitosamente
- Actualiza isActive exitosamente
- Actualiza múltiples campos a la vez
- Retorna 400 si nombre muy corto
- Retorna 400 si duración < 5 minutos
- Retorna 400 si precio negativo
- Retorna 500 en error de base de datos

**DELETE /api/services/[id]** - 8 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta eliminar
- Retorna 403 si staff intenta eliminar (solo admin puede)
- Retorna 404 si servicio no existe
- Elimina servicio exitosamente cuando no hay turnos asociados
- Desactiva en lugar de eliminar cuando hay turnos asociados
- Verifica cantidad de turnos antes de eliminar
- Retorna 500 en error de base de datos

---

## 7. Tests para Clients API

### Archivos Creados

#### `src/app/api/clients/__tests__/route.test.ts` - 14 tests

**GET /api/clients** - 14 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta listar clientes
- Retorna clientes para admin
- Retorna clientes para staff
- Filtra por rol CLIENT
- Busca por nombre, email o teléfono
- Soporta paginación con parámetro page
- Retorna información de paginación
- Usa valores de paginación por defecto
- Ordena clientes por createdAt descendente
- Incluye clientProfile y conteo de appointments
- Incluye información del último turno
- Retorna 500 en error de base de datos

#### `src/app/api/clients/[id]/__tests__/route.test.ts` - 21 tests

**GET /api/clients/[id]** - 12 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta acceder a otro cliente
- Retorna cliente para cliente accediendo a su propio perfil
- Retorna cliente para admin accediendo cualquier cliente
- Retorna cliente para staff accediendo cualquier cliente
- Retorna 404 si cliente no existe
- Filtra por rol CLIENT al buscar usuario
- Incluye clientProfile en respuesta
- Incluye appointments en respuesta
- Incluye records en respuesta
- Retorna 500 en error de base de datos

**PATCH /api/clients/[id]** - 9 tests:
- Retorna 401 si no autenticado
- Retorna 403 si cliente intenta actualizar perfil
- Retorna 404 si cliente no existe
- Actualiza internalNotes exitosamente para admin
- Actualiza tags exitosamente para staff
- Actualiza preferredStaffId exitosamente
- Actualiza múltiples campos a la vez
- No actualiza campos no proporcionados
- Verifica que cliente existe con rol CLIENT
- Retorna clientProfile en respuesta
- Retorna 500 en error de base de datos

---

## 8. Tests para Staff API

### Archivos Creados

#### `src/app/api/staff/__tests__/route.test.ts` - 16 tests

**GET /api/staff** - 8 tests:
- Retorna staff activo por defecto (sin autenticación requerida)
- Filtra por rol STAFF
- Filtra por isActive true por defecto
- Retorna 403 si no-admin intenta incluir inactivos
- Retorna todo el staff para admin con includeInactive=true
- Ordena por nombre ascendente
- Aplana staffProfile en respuesta
- Retorna 500 en error de base de datos

**POST /api/staff** - 8 tests:
- Retorna 403 si no es admin
- Retorna 403 si staff intenta crear
- Crea staff exitosamente para admin
- Retorna 400 si email ya existe
- Retorna 400 si nombre muy corto
- Retorna 400 si email inválido
- Retorna 400 si contraseña muy corta
- Retorna 500 en error de base de datos

#### `src/app/api/staff/[id]/__tests__/route.test.ts` - 19 tests

**GET /api/staff/[id]** - 5 tests:
- Retorna staff por id (sin autenticación requerida)
- Retorna 404 si staff no existe
- Filtra por rol STAFF al buscar
- Aplana staffProfile en respuesta
- Retorna 500 en error de base de datos

**PATCH /api/staff/[id]** - 8 tests:
- Retorna 403 si no es admin
- Retorna 403 si staff intenta actualizar
- Retorna 404 si staff no existe
- Actualiza staff exitosamente para admin
- Actualiza nombre exitosamente
- Actualiza isActive exitosamente
- Retorna 400 si nombre muy corto
- Retorna 500 en error de base de datos

**DELETE /api/staff/[id]** - 6 tests:
- Retorna 403 si no es admin
- Retorna 403 si staff intenta eliminar
- Retorna 404 si staff no existe
- Elimina staff cuando no hay turnos pendientes
- Desactiva en lugar de eliminar cuando hay turnos pendientes
- Retorna 500 en error de base de datos

---

## 9. Tests para Admin Stats API

### Archivos Creados

#### `src/app/api/admin/stats/__tests__/route.test.ts` - 11 tests

**GET /api/admin/stats** - 11 tests:
- Retorna 401 si usuario no autenticado
- Retorna 403 si cliente intenta acceder stats
- Retorna stats para admin
- Retorna stats para staff
- Retorna conteo de appointmentsToday
- Retorna conteo de appointmentsPending
- Calcula monthlyRevenue de turnos completados
- Retorna conteo de newClientsThisMonth
- Retorna conteo de totalClients
- Retorna upcomingToday appointments
- Retorna 500 en error de base de datos

---

## Resumen Final

### Estado de Tests
| Métrica | Valor |
|---------|-------|
| Archivos de test | 27 |
| Tests totales | 414 |
| Tests pasando | 414 |
| Cobertura estimada | ~45% |

### Tests por Área
| Área | Tests |
|------|-------|
| Auth (registro/login) | 19 |
| Appointments API | 21 |
| Appointments [id] API | 7 |
| Available Slots API | 8 |
| Records API | 18 |
| Records [id] API | 21 |
| Services API | 17 |
| Services [id] API | 25 |
| Clients API | 13 |
| Clients [id] API | 21 |
| Staff API | 16 |
| Staff [id] API | 19 |
| Admin Stats API | 11 |
| Hooks (use-appointments) | 12 |
| Hooks (use-services) | 15 |
| Hooks (use-clients) | 14 |
| Hooks (use-records) | 20 |
| UI (nueva-reserva) | 15 |
| UI (AppointmentCard) | 24 |
| UI (SlotPicker) | 11 |
| UI (StaffCard) | 16 |
| UI (ServiceCard) | 20 |
| UI (EmptyState) | 12 |
| Promotion Service | 15 |
| Availability Service | 22 |

### Tests Pendientes (Opcionales)
| Área | Tests Estimados |
|------|-----------------|
| E2E Playwright | ~10 |

---

## 10. Tests para Hooks

### Archivos Creados

#### `src/hooks/__tests__/use-services.test.tsx` - 15 tests

**useServices** - 4 tests:
- Obtiene servicios activos por defecto
- Obtiene todos los servicios cuando active=false
- No fetch cuando enabled=false
- Maneja errores de API

**useServiceById** - 3 tests:
- Obtiene servicio por id exitosamente
- No fetch cuando id está vacío
- Maneja error de servicio no encontrado

**useCreateService** - 3 tests:
- Crea servicio exitosamente
- Maneja error de creación
- Envía todos los campos opcionales

**useUpdateService** - 3 tests:
- Actualiza servicio exitosamente
- Maneja error de actualización
- Actualiza múltiples campos a la vez

**useDeleteService** - 2 tests:
- Elimina servicio exitosamente
- Maneja error de eliminación

#### `src/hooks/__tests__/use-clients.test.tsx` - 14 tests

**useClients** - 5 tests:
- Obtiene clientes exitosamente
- Pasa parámetro de búsqueda correctamente
- Pasa parámetros de paginación correctamente
- Maneja errores de API
- Maneja error de acceso no autorizado

**useClientById** - 4 tests:
- Obtiene cliente por id exitosamente
- No fetch cuando id está vacío
- Maneja error de cliente no encontrado
- Incluye datos de clientProfile en respuesta

**useUpdateClientProfile** - 5 tests:
- Actualiza perfil de cliente exitosamente
- Actualiza tags exitosamente
- Actualiza preferredStaffId exitosamente
- Maneja error de actualización
- Actualiza múltiples campos a la vez

#### `src/hooks/__tests__/use-records.test.tsx` - 20 tests

**useRecords** - 4 tests:
- Obtiene records exitosamente
- Pasa parámetro clientId correctamente
- Maneja errores de API
- Maneja error de acceso no autorizado

**useRecordById** - 4 tests:
- Obtiene record por id exitosamente
- No fetch cuando id está vacío
- Maneja error de record no encontrado
- Incluye service y staff en respuesta

**useCreateRecord** - 4 tests:
- Crea record exitosamente
- Maneja error de creación
- Envía todos los campos opcionales
- Maneja error de no autorizado

**useUpdateRecord** - 5 tests:
- Actualiza record exitosamente
- Actualiza tags exitosamente
- Actualiza photoUrls exitosamente
- Maneja error de actualización
- Actualiza múltiples campos a la vez

**useDeleteRecord** - 3 tests:
- Elimina record exitosamente
- Maneja error de eliminación
- Maneja error de no autorizado

---

## 11. Tests para Componentes UI

### Archivos Creados

#### `src/components/appointments/__tests__/appointment-card.test.tsx` - 24 tests

**Renderizado básico** - 5 tests:
- Renderiza fecha y hora del turno
- Renderiza nombre y precio del servicio
- Renderiza nombre del barbero
- Renderiza notas del cliente cuando están presentes
- No renderiza notas cuando no hay

**Badges de estado** - 5 tests:
- Muestra badge Pendiente para status PENDING
- Muestra badge Confirmado para status CONFIRMED
- Muestra badge Completado para status COMPLETED
- Muestra badge Cancelado para status CANCELLED
- Muestra badge No asistió para status NO_SHOW

**Comportamiento rol cliente** - 5 tests:
- Muestra botón cancelar para status PENDING
- Muestra botón cancelar para status CONFIRMED
- No muestra botón cancelar para COMPLETED
- No muestra info de cliente para rol CLIENT
- Llama onCancel al hacer click

**Comportamiento rol admin/staff** - 6 tests:
- Muestra info de cliente para ADMIN
- Muestra info de cliente para STAFF
- Muestra teléfono de cliente cuando disponible
- Muestra botón confirmar para PENDING
- Muestra botón completar para CONFIRMED
- Llama callbacks correctamente

**Casos edge** - 3 tests:
- Renderiza sin staff cuando no asignado
- Maneja precio string correctamente

#### `src/components/appointments/__tests__/slot-picker.test.tsx` - 11 tests

- Renderiza slots disponibles
- Renderiza todos los tiempos de slots
- Muestra estado de carga con botones skeleton
- Muestra estado vacío cuando no hay slots
- Muestra mensaje cuando todos ocupados
- Llama onSelect al clickear slot disponible
- No llama onSelect al clickear slot no disponible
- Resalta slot seleccionado
- Deshabilita slots no disponibles
- Muestra forma singular para 1 slot disponible
- Maneja objetos Date para tiempos de slot

#### `src/components/staff/__tests__/staff-card.test.tsx` - 16 tests

**Renderizado básico** - 6 tests:
- Renderiza nombre del staff
- Renderiza bio del staff
- Renderiza especialidades como badges
- Renderiza lista de servicios
- Muestra +N más cuando hay más de 3 servicios
- Genera iniciales del nombre

**Modo público** - 1 test:
- Renderiza link de reserva cuando no hay onSelect

**Modo selección** - 4 tests:
- Muestra botón Seleccionar cuando hay onSelect
- Muestra Seleccionado cuando selected=true
- Llama onSelect con staffId al click
- Aplica estilos de borde cuando seleccionado

**Casos edge** - 5 tests:
- Renderiza sin bio
- Renderiza sin sección especialidades
- Renderiza sin sección servicios
- Maneja nombre de una palabra para iniciales
- Maneja nombre largo para iniciales

#### `src/components/services/__tests__/service-card.test.tsx` - 20 tests

**Renderizado básico** - 6 tests:
- Renderiza nombre del servicio
- Renderiza descripción del servicio
- Renderiza duración del servicio
- Renderiza precio formateado
- Renderiza imagen cuando se proporciona
- Renderiza placeholder cuando no hay imagen

**Variante pública** - 3 tests:
- Muestra botón Reservar por defecto
- Link a página de reserva con id de servicio
- No muestra badge inactivo

**Variante admin** - 4 tests:
- Muestra botón Editar
- Llama onEdit al clickear Editar
- Muestra badge inactivo para servicios inactivos
- No muestra badge inactivo para servicios activos

**Display de promoción** - 5 tests:
- Muestra precio con descuento cuando promo activa
- Muestra badge Promo cuando promo activa
- Muestra precio original tachado
- No muestra promo cuando servicio no está en lista
- No muestra promo cuando promoción deshabilitada

**Casos edge** - 2 tests:
- Maneja precio string correctamente
- Renderiza sin descripción

#### `src/components/shared/__tests__/empty-state.test.tsx` - 12 tests

- Renderiza título
- Renderiza descripción cuando se proporciona
- No renderiza descripción cuando no hay
- Renderiza icono cuando se proporciona
- Renderiza botón de acción cuando se proporciona
- Llama onClick de acción al clickear
- No renderiza botón cuando no hay acción
- Renderiza children cuando se proporcionan
- Renderiza con icono Search
- Renderiza con icono FileX
- Renderiza todos los elementos juntos
- Tiene clases de estilo correctas
