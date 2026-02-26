# Changelog

Todos los cambios notables del proyecto BarberPro serán documentados en este archivo.

## [Unreleased]

### Agregado
- **Comprobante de transferencia en reservas**: Nuevo paso obligatorio (paso 4) en el wizard de reservas donde el cliente sube un comprobante de transferencia bancaria antes de confirmar la cita.
  - Card con datos bancarios (banco, titular, cuenta, monto)
  - Upload de imagen del comprobante (JPG, PNG, WEBP, máx. 5MB)
  - Preview de la imagen con opción de eliminar/cambiar
  - El wizard ahora tiene 5 pasos en vez de 4
- **API de upload de comprobantes**: `POST /api/upload/transfers` para subir imágenes de comprobantes de pago (accesible por clientes autenticados)
- **Bucket `transfers` en Supabase Storage** para almacenar comprobantes
- **Campos de pago en Appointment**: `paymentProofUrl` (URL del comprobante) y `paymentStatus` (PENDING, APPROVED, REJECTED)
- **Gestión de pagos en admin**: Columna "Pago" en la tabla de turnos con:
  - Enlace para ver el comprobante en un dialog
  - Badge con estado del pago (Pendiente, Aprobado, Rechazado)
  - Botones para aprobar o rechazar el comprobante

### Modificado
- Wizard de reservas actualizado de 4 a 5 pasos (nuevo paso 4: comprobante de pago)
- Barra de progreso y textos actualizados para reflejar 5 pasos
- Validaciones Zod de appointments actualizadas con campos de pago
- API `POST /api/appointments` acepta `paymentProofUrl`
- API `PATCH /api/appointments/[id]` permite actualizar `paymentStatus` (admin)
- Tests del wizard actualizados para el nuevo flujo de 5 pasos

---

## Historial previo

- `41819b9` - fix: frontend history records price
- `ca33748` - fix: frontend promo day
- `9cbe237` - feat: add mobile auth endpoints (login, google, JWT)
- `c483a34` - test: Tests for the full system covered
- `e9aec8b` - test: Test promo days
