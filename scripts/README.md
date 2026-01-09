# Scripts de Utilidades

Scripts de mantenimiento y migración para BarberPro.

## Migración de Turnos Completados

### `migrate-completed-appointments.ts`

Este script migra todos los turnos con estado `COMPLETED` a la tabla de historial de cortes (`HaircutRecord`).

**¿Cuándo usarlo?**
- Después de implementar el sistema de historial de cortes
- Si hay turnos completados antiguos que no tienen registro en el historial
- Para sincronizar datos después de una restauración de base de datos

**Cómo ejecutar:**

```bash
npx tsx scripts/migrate-completed-appointments.ts
```

**¿Qué hace?**
1. Busca todos los turnos con estado `COMPLETED`
2. Verifica si ya existe un registro en `HaircutRecord` para cada turno
3. Crea automáticamente registros para los turnos que no tienen historial
4. Evita duplicados verificando la combinación de: cliente + servicio + fecha
5. Preserva información del barbero, precio y notas

**Salida esperada:**
```
🚀 Iniciando migración de turnos completados...

📊 Encontrados 13 turnos completados

✅ Migrado: Nuevo Usuario - Corte Clásico (2026-01-08)
✅ Migrado: Test User - Fade Moderno (2026-01-09)
⏭️  Saltando turno existente: Ricardo Toledo - Corte Clásico (2026-01-10)

==================================================
🎉 Migración completada!
✅ Registros migrados: 12
⏭️  Registros saltados (ya existían): 1
==================================================
```

**Seguridad:**
- ✅ El script es seguro de ejecutar múltiples veces (no crea duplicados)
- ✅ Solo lee y crea registros, no modifica turnos existentes
- ✅ Registra cada operación en la consola para auditoría

## Desarrollo de Nuevos Scripts

Para crear nuevos scripts:

1. Crear archivo TypeScript en `/scripts/`
2. Importar PrismaClient: `import { PrismaClient } from "@prisma/client"`
3. Agregar documentación en este README
4. Ejecutar con: `npx tsx scripts/tu-script.ts`
