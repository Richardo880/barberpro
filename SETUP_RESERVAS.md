# ✅ Configuración de Sistema de Reservas

## 🎯 Problema Resuelto

**Problema**: "No se cuenta con horarios disponibles" al intentar hacer una reserva.

**Causa**: Faltaban datos de configuración (horarios de atención y appointments de ejemplo).

**Solución**: Script de seeding automático con datos de ejemplo.

## 🚀 Configuración Rápida

### 1. Asegúrate que PostgreSQL esté corriendo

```bash
npm run docker:up
```

### 2. Ejecuta el script de seeding

```bash
npm run db:seed:appointments
```

Esto creará:
- ✅ Horarios de atención (Lun-Sáb: 9:00-18:00, Dom: cerrado)
- ✅ 5 clientes de ejemplo
- ✅ 20-30 appointments en los próximos 7 días
- ✅ Variedad de estados (PENDING, CONFIRMED, COMPLETED)

### 3. Inicia el servidor

```bash
npm run dev
```

### 4. Prueba el sistema de reservas

1. Ve a `http://localhost:3000/mi-cuenta/nueva-reserva`
2. Selecciona un servicio
3. Elige un barbero (o "Sin preferencia")
4. Selecciona una fecha (próximos 7 días)
5. **Deberías ver horarios disponibles y ocupados** 🎉
6. Elige un horario disponible
7. Confirma la reserva
8. **Verás un popup de confirmación** ✅

## 📋 Qué se Configuró

### Horarios de Atención

```
Lunes    : 09:00 - 18:00
Martes   : 09:00 - 18:00
Miércoles: 09:00 - 18:00
Jueves   : 09:00 - 18:00
Viernes  : 09:00 - 20:00
Sábado   : 09:00 - 17:00
Domingo  : Cerrado
```

### Slots Generados

- **Intervalo**: Cada 30 minutos
- **Ejemplos**: 09:00, 09:30, 10:00, 10:30, etc.
- **Lógica**: Si el servicio dura 45 min y reservas a las 10:00, el slot termina a las 10:45

### Estados de Appointments

- **PENDING**: Pendiente de confirmación
- **CONFIRMED**: Confirmado
- **COMPLETED**: Atendido (appointments pasados)
- **CANCELLED**: Cancelado

### Distribución de Ejemplo

Por día (de Lunes a Sábado):
- 3-5 appointments ocupados
- Horarios variados: mañana (9-12) y tarde (14-17)
- Diferentes barberos
- Diferentes servicios

## 🎨 Nuevas Funcionalidades

### 1. Visualización Clara de Disponibilidad

```tsx
// Verde (habilitado) = Disponible
// Gris (deshabilitado) = Ocupado
<Button disabled={!slot.available}>
  {slot.time}
</Button>
```

### 2. Popup de Confirmación

Después de crear una reserva, aparece un popup con:
- ✅ Ícono de éxito (check verde)
- ✅ Mensaje de confirmación
- ✅ Resumen de la reserva (fecha, hora, servicio, barbero)
- ✅ Botón para ver todas las reservas

### 3. Formato de Hora Mejorado

La API ahora devuelve:
```json
{
  "slots": [
    {
      "time": "09:00",           // ← Formato simple para mostrar
      "start": "2026-01-08T...", // ISO completo
      "end": "2026-01-08T...",   // ISO completo
      "available": true
    }
  ]
}
```

## 🔍 Cómo Funciona el Sistema

### 1. Generar Slots Base

```typescript
// De 09:00 a 18:00, cada 30 minutos
09:00 → 09:30 → 10:00 → 10:30 → ... → 18:00
```

### 2. Marcar Slots Ocupados

```typescript
// Si hay un appointment de 10:00 a 10:45
// Los slots 10:00 y 10:30 se marcan como no disponibles
```

### 3. Considerar Duración del Servicio

```typescript
// Servicio de 45 min a las 10:00
// Ocupa: 10:00-10:45
// Slots afectados: 10:00, 10:30
```

### 4. Buffer Time (Opcional)

```typescript
// Buffer de 10 min entre turnos
// Appointment 10:00-10:45
// Siguiente disponible: 10:55 (no 10:45)
```

## 🧪 Verificar Datos Sembrados

### Ver en Prisma Studio

```bash
npm run db:studio
```

Ir a `http://localhost:5555` y revisar:

1. **business_hours**: Deberían haber 7 registros (1 por día)
2. **appointments**: ~20-30 registros para los próximos 7 días
3. **users**: Deberían incluir clientes de ejemplo

### Ver en SQL

```bash
docker exec -it barberpro-db psql -U barberpro -d barberpro
```

```sql
-- Ver horarios de atención
SELECT * FROM business_hours ORDER BY day_of_week;

-- Ver appointments de hoy en adelante
SELECT
  a.start_time,
  a.status,
  u.name as client_name,
  s.name as service_name
FROM appointments a
JOIN users u ON a.client_id = u.id
JOIN services s ON a.service_id = s.id
WHERE a.start_time >= NOW()
ORDER BY a.start_time;
```

## 📊 Ejemplo de Flujo Completo

### Usuario en el Frontend

1. **Paso 1**: Elige "Corte de cabello" (30 min)
2. **Paso 2**: Elige "Carlos López" como barbero
3. **Paso 3**: Selecciona "Viernes 10 de Enero"
4. **Resultado**: Ve slots disponibles:

```
✅ 09:00  ✅ 09:30  ❌ 10:00  ❌ 10:30  ✅ 11:00
✅ 11:30  ✅ 14:00  ❌ 14:30  ✅ 15:00  ✅ 15:30
```

5. **Acción**: Selecciona 11:00
6. **Paso 4**: Revisa y confirma
7. **Resultado**: Popup de confirmación + redirect a "Mis Reservas"

## 🛠️ Personalización

### Cambiar Horarios de Atención

Edita `src/db/seed-appointments.ts`:

```typescript
const businessHoursData = [
  {
    dayOfWeek: DayOfWeek.MONDAY,
    isOpen: true,
    openTime: '08:00',  // ← Cambia aquí
    closeTime: '20:00'  // ← Y aquí
  },
  // ...
];
```

Luego ejecuta de nuevo:
```bash
npm run db:seed:appointments
```

### Cambiar Intervalo de Slots

En `src/server/services/availability.service.ts`:

```typescript
const SLOT_INTERVAL_MINUTES = 30; // Cambiar a 15, 20, 30, 60, etc.
```

### Cambiar Buffer Time

Actualiza en la base de datos:

```sql
INSERT INTO app_config (key, value, type, description)
VALUES ('buffer_time_minutes', '15', 'number', 'Minutos de buffer entre turnos')
ON CONFLICT (key) DO UPDATE SET value = '15';
```

## ❗ Troubleshooting

### "No hay horarios disponibles"

**Causas posibles**:
1. No se ejecutó el seeding: `npm run db:seed:appointments`
2. Seleccionaste domingo (cerrado)
3. Todos los slots están ocupados ese día

**Solución**:
```bash
# Re-ejecutar seeding
npm run db:seed:appointments

# Probar con otro día de la semana
```

### "Los slots no coinciden con los appointments"

**Causa**: Zona horaria o formato de fecha incorrecto.

**Verificar**:
```typescript
// En availability.service.ts
const TIMEZONE = 'America/Asuncion'; // ← Verifica que sea correcto
```

### "Error al crear appointment"

**Causa**: Conflicto de horario (alguien reservó al mismo tiempo).

**Solución**: Selecciona otro horario. El sistema valida disponibilidad antes de crear.

## 📝 Archivos Modificados

```
src/
├── db/
│   └── seed-appointments.ts           ← Nuevo script de seeding
├── app/
│   ├── api/
│   │   └── appointments/
│   │       └── available-slots/
│   │           └── route.ts           ← Formato de respuesta mejorado
│   └── (dashboard)/
│       └── mi-cuenta/
│           └── nueva-reserva/
│               └── page.tsx           ← Popup de confirmación
└── server/
    └── services/
        └── availability.service.ts    ← Lógica de disponibilidad

package.json                           ← Nuevo comando: db:seed:appointments
```

## ✨ Resumen

✅ **Horarios de atención configurados**
✅ **Appointments de ejemplo creados**
✅ **Sistema de disponibilidad funcionando**
✅ **Popup de confirmación agregado**
✅ **Formato de hora mejorado**
✅ **Listo para usar en producción**

## 🎯 Próximos Pasos

Después de probar el sistema:

1. **Personaliza horarios** según tu negocio
2. **Ajusta intervalos** de slots si es necesario
3. **Configura buffer time** entre turnos
4. **Agrega más servicios** en `npm run db:seed`
5. **Invita usuarios reales** a registrarse

## 📞 Comandos Útiles

```bash
# Sembrar appointments
npm run db:seed:appointments

# Ver base de datos
npm run db:studio

# Resetear todo (CUIDADO: borra datos)
npm run db:reset

# Sembrar datos base (servicios, staff)
npm run db:seed

# Ver logs
npm run docker:logs
```

---

**Fecha**: 2026-01-08
**Estado**: ✅ Funcionando correctamente
**Siguiente**: Personalizar según necesidades del negocio
