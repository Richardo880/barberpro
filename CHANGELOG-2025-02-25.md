# Changelog - 2025-02-25

## Bug Fix: Precio de promo incorrecto en reservas para otros días

### Problema
Cuando hoy es miércoles (día de promo), al reservar un turno para otro día (ej: jueves), el wizard de reservas mostraba el precio con descuento en vez del precio original.

### Causa raíz
La función `isPromoActive()` en `src/hooks/use-promotion.ts` solo verificaba `new Date().getDay()` (el día de HOY), sin considerar la fecha seleccionada por el usuario para la cita.

### Archivos modificados
- **`src/hooks/use-promotion.ts`**
  - Agregada función `isPromoDayForDate(config, date)` que verifica contra una fecha específica
  - `getDiscountedPrice()` ahora acepta un parámetro opcional `date` — si se pasa, verifica contra esa fecha; si no, usa hoy como fallback
- **`src/app/(dashboard)/mi-cuenta/nueva-reserva/page.tsx`**
  - Paso 4 (confirmación): ahora pasa `state.date` a `getDiscountedPrice()` para mostrar el precio correcto según el día de la cita

---

## Bug Fix: Historial de cortes no refleja precio de promo

### Problema
Al crear manualmente un registro de corte desde el panel de admin (RecordDialog), siempre se guardaba el precio original del servicio, sin aplicar el descuento de promo aunque la fecha del registro cayera en día de promo.

### Causa raíz
El componente `RecordDialog` no consultaba la configuración de promociones. Al seleccionar un servicio, simplemente asignaba `Number(selectedService.price)` como precio, sin calcular descuentos. Además, no enviaba los campos `originalPrice`, `discountAmount` ni `promotionApplied` al API.

### Archivos modificados
- **`src/components/admin/record-dialog.tsx`**
  - Importados `usePromotion`, `getDiscountedPrice`, `Badge`, `Tag`
  - Agregada función `calculatePromoPrice()` que calcula el precio con descuento para un servicio y fecha dados
  - `handleServiceChange()` ahora calcula el precio con promo al seleccionar servicio
  - Agregado `handleDateChange()` que recalcula el precio cuando cambia la fecha
  - El submit ahora envía `originalPrice`, `discountAmount` y `promotionApplied` al API
  - Agregado indicador visual (Badge "Promo aplicada" + precio original tachado) junto al campo de precio
- **`src/hooks/use-records.ts`**
  - Agregados campos opcionales `originalPrice`, `discountAmount`, `promotionApplied` a la interface `CreateRecordData`

### Nota
El flujo automático (marcar cita como COMPLETED en `/api/appointments/[id]`) ya funcionaba correctamente — usa `calculatePriceWithPromotion()` del backend que verifica la fecha de la cita.

---

## Tests: Cobertura para los bug fixes de promo

### Archivos creados
- **`src/hooks/__tests__/use-promotion.test.ts`** (16 tests)
  - `isPromoDayForDate`: verifica fecha correcta vs día de promo, config disabled, config undefined
  - `getDiscountedPrice` sin fecha: config undefined, promo disabled, servicio no elegible
  - `getDiscountedPrice` con fecha: descuento correcto en día promo, sin descuento en día normal, servicio no elegible, cap a 0, config undefined
  - Escenarios del bug: hoy miércoles + reserva jueves = sin descuento; hoy jueves + reserva miércoles = con descuento
  - `isPromoActive`: config undefined, promo disabled

- **`src/components/admin/__tests__/record-dialog.test.tsx`** (13 tests)
  - Renderizado básico del dialog
  - Auto-fill de precio con descuento en día promo (miércoles)
  - Auto-fill de precio original en día no-promo (jueves)
  - Badge "Promo aplicada" visible solo cuando aplica
  - Sin badge para servicio no elegible en día promo
  - Sin badge en día no-promo para servicio elegible
  - Recalculación de precio al cambiar fecha de no-promo a promo
  - Recalculación de precio al cambiar fecha de promo a no-promo
  - Submit envía campos de promo correctos en día promo
  - Submit envía sin promo en día no-promo
  - Sin promo cuando no hay datos de promoción disponibles
  - Validación de campos requeridos
  - Fecha por defecto es hoy

### Total: 29 tests, todos pasando
