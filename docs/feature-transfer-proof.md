# Feature: Comprobante de Transferencia en Reservas

Documento técnico con todos los pasos realizados para implementar el paso de comprobante de transferencia bancaria en el wizard de reservas.

---

## 1. Modelo de datos - Prisma Schema

**Archivo:** `src/db/schema.prisma`

Se creó el enum `PaymentStatus` con tres estados:

```prisma
enum PaymentStatus {
  PENDING    // Comprobante pendiente de revisión
  APPROVED   // Comprobante aprobado por admin
  REJECTED   // Comprobante rechazado por admin
}
```

Se agregaron dos campos al modelo `Appointment`:

```prisma
paymentProofUrl String?         // URL del comprobante de transferencia
paymentStatus   PaymentStatus   @default(PENDING) // Estado del comprobante
```

Se ejecutó la migración:

```bash
npx prisma migrate dev --name add_payment_proof_to_appointments
```

Esto generó el archivo `src/db/migrations/20260225235551_add_payment_proof_to_appointments/migration.sql`.

---

## 2. Bucket de Supabase Storage

**Archivo:** `src/lib/supabase.ts`

Se agregó `TRANSFERS` al objeto `STORAGE_BUCKETS`:

```ts
export const STORAGE_BUCKETS = {
  RECORDS: 'records',
  SERVICES: 'services',
  STAFF: 'staff',
  TRANSFERS: 'transfers',  // <-- nuevo
} as const;
```

Se creó manualmente el bucket `transfers` en Supabase Dashboard > Storage con acceso público de lectura.

---

## 3. API de upload de comprobantes

**Archivo nuevo:** `src/app/api/upload/transfers/route.ts`

Endpoint `POST /api/upload/transfers` basado en el patrón existente de `/api/upload/records/route.ts`.

Diferencias clave con el upload de records:
- Permite acceso a **clientes** (no solo ADMIN/STAFF)
- Acepta un solo archivo (`file`) en vez de múltiples (`files`)
- Valida tipo de archivo (solo imágenes) y tamaño (máx. 5MB)
- Ruta en storage: `{userId}/{timestamp}-{random}.{ext}`
- Retorna `{ url: string }` con la URL pública
- Usa `getSessionFromRequest()` para soportar tanto web como mobile

---

## 4. Validaciones Zod

**Archivo:** `src/lib/validations/appointment.ts`

Se agregó `paymentProofUrl` al schema de creación:

```ts
export const createAppointmentSchema = z.object({
  // ... campos existentes
  paymentProofUrl: z.string().url({ message: 'URL de comprobante inválida' }).optional(),
});
```

Se agregó `paymentStatus` al schema de actualización admin:

```ts
export const updateAppointmentAdminSchema = z.object({
  // ... campos existentes
  paymentStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
```

---

## 5. API de Appointments

### POST `/api/appointments` (crear reserva)

**Archivo:** `src/app/api/appointments/route.ts`

Se extrajo `paymentProofUrl` de los datos validados y se incluyó en el `prisma.appointment.create()`:

```ts
const { serviceId, staffId, startTime, clientNotes, paymentProofUrl } = validated.data;

// En el create:
paymentProofUrl: paymentProofUrl || null,
```

### PATCH `/api/appointments/[id]` (actualizar reserva)

**Archivo:** `src/app/api/appointments/[id]/route.ts`

No se requirió cambio directo porque el schema `updateAppointmentAdminSchema` ya incluye `paymentStatus` y el `validated.data` se pasa directamente al update de Prisma.

---

## 6. Hook de React Query

**Archivo:** `src/hooks/use-appointments.ts`

Se actualizaron las interfaces TypeScript:

```ts
export interface Appointment {
  // ... campos existentes
  paymentProofUrl?: string | null;
  paymentStatus?: string;
}

interface CreateAppointmentData {
  // ... campos existentes
  paymentProofUrl?: string;
}

interface UpdateAppointmentData {
  // ... campos existentes
  paymentStatus?: string;
}
```

---

## 7. Wizard de reservas (4 → 5 pasos)

**Archivo:** `src/app/(dashboard)/mi-cuenta/nueva-reserva/page.tsx`

### Cambios en el estado

```ts
interface WizardState {
  serviceId: string | null;
  staffId: string | null;
  date: Date | null;
  timeSlot: string | null;
  paymentProofUrl: string | null;  // <-- nuevo
  notes: string;
}

const TOTAL_STEPS = 5;  // antes era 4
```

### Nuevas variables de estado

```ts
const [uploading, setUploading] = useState(false);
const [proofPreview, setProofPreview] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Nuevo flujo de pasos

| Paso | Antes | Después |
|------|-------|---------|
| 1 | Seleccionar servicio | Seleccionar servicio |
| 2 | Seleccionar barbero | Seleccionar barbero |
| 3 | Seleccionar fecha/hora | Seleccionar fecha/hora |
| 4 | Confirmación | **Comprobante de pago** (NUEVO) |
| 5 | - | Confirmación |

### Paso 4 nuevo - Contenido

1. **Card de datos bancarios**: Banco Continental, titular, cédula, cuenta, monto (precio del servicio con promo si aplica)
2. **Zona de upload**: Área de drag/click para subir imagen, preview con botón de eliminar
3. **Botón "Continuar"**: Habilitado solo cuando `paymentProofUrl` está seteado

### Funciones nuevas

- `getServicePrice()` - Calcula el precio final del servicio (con descuento si aplica)
- `handleFileUpload()` - Valida el archivo, genera preview local, sube a `/api/upload/transfers`, guarda URL en state
- `handleRemoveProof()` - Limpia la imagen y resetea el input

### handleSubmit actualizado

Ahora envía `paymentProofUrl` al crear la reserva:

```ts
await createMutation.mutateAsync({
  serviceId: state.serviceId,
  staffId: state.staffId || undefined,
  startTime: appointmentDate.toISOString(),
  clientNotes: state.notes || undefined,
  paymentProofUrl: state.paymentProofUrl,  // <-- nuevo
});
```

### Progress bar

```ts
const progress = (step / TOTAL_STEPS) * 100;  // TOTAL_STEPS = 5
// Paso 1 = 20%, Paso 2 = 40%, Paso 3 = 60%, Paso 4 = 80%, Paso 5 = 100%
```

---

## 8. Panel admin de turnos

**Archivo:** `src/app/admin/turnos/page.tsx`

### Nueva columna "Pago" en la tabla

Para cada appointment:
- Si tiene `paymentProofUrl`: muestra enlace "Ver comprobante", badge de estado, y botones aprobar/rechazar
- Si no tiene: muestra "Sin comprobante"

### Mapas de estilos y labels

```ts
const paymentStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const paymentStatusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};
```

### Dialog de comprobante

Se agregó un `Dialog` (de shadcn/ui) que muestra la imagen del comprobante a tamaño completo al hacer clic en "Ver comprobante".

### Función nueva

```ts
const handleUpdatePaymentStatus = async (id: string, paymentStatus: string) => {
  await updateMutation.mutateAsync({ id, data: { paymentStatus } });
};
```

---

## 9. Tests actualizados

**Archivo:** `src/app/(dashboard)/mi-cuenta/nueva-reserva/__tests__/nueva-reserva.test.tsx`

- Cambiado `"paso X de 4"` → `"paso X de 5"` en todas las aserciones
- Cambiado `25%` → `20%` en la aserción de la barra de progreso
- Removido import no utilizado `within`

**Archivo:** `src/test/mockData.ts`

Se agregaron los nuevos campos al mock de appointment:

```ts
paymentProofUrl: null,
paymentStatus: "PENDING" as const,
```

---

## 10. Verificación

1. Migración aplicada exitosamente
2. TypeScript sin errores en archivos modificados (`npx tsc --noEmit`)
3. 29 archivos de test pasando, 443 tests pasando (`npm run test`)
4. Dev server funciona correctamente (`npm run dev`)

---

## Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `src/db/schema.prisma` | Modificado - enum + campos |
| `src/db/migrations/20260225235551_.../migration.sql` | Creado - migración |
| `src/lib/supabase.ts` | Modificado - bucket TRANSFERS |
| `src/app/api/upload/transfers/route.ts` | **Creado** - endpoint de upload |
| `src/lib/validations/appointment.ts` | Modificado - campos Zod |
| `src/app/api/appointments/route.ts` | Modificado - acepta paymentProofUrl |
| `src/hooks/use-appointments.ts` | Modificado - tipos TS |
| `src/app/(dashboard)/mi-cuenta/nueva-reserva/page.tsx` | Modificado - wizard 5 pasos |
| `src/app/admin/turnos/page.tsx` | Modificado - columna pago + dialog |
| `src/test/mockData.ts` | Modificado - mock data |
| `src/app/(dashboard)/mi-cuenta/nueva-reserva/__tests__/nueva-reserva.test.tsx` | Modificado - tests |
