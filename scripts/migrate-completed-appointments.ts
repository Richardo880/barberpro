/**
 * Script de migración: Crear registros de cortes para todos los turnos completados
 * que aún no tienen un registro asociado en HaircutRecord
 *
 * Ejecutar con: npx tsx scripts/migrate-completed-appointments.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateCompletedAppointments() {
  console.log("🚀 Iniciando migración de turnos completados...\n");

  try {
    // Obtener todos los turnos con estado COMPLETED
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        service: true,
        client: true,
      },
    });

    console.log(`📊 Encontrados ${completedAppointments.length} turnos completados\n`);

    if (completedAppointments.length === 0) {
      console.log("✅ No hay turnos completados para migrar");
      return;
    }

    // Obtener todos los registros existentes para evitar duplicados
    const existingRecords = await prisma.haircutRecord.findMany({
      select: {
        clientId: true,
        date: true,
        serviceId: true,
      },
    });

    // Crear un Set para búsqueda rápida de registros existentes
    const existingRecordsSet = new Set(
      existingRecords.map(
        (r) => `${r.clientId}-${r.serviceId}-${r.date.toISOString()}`
      )
    );

    let migratedCount = 0;
    let skippedCount = 0;

    // Procesar cada turno completado
    for (const appointment of completedAppointments) {
      // Crear clave única para verificar si ya existe un registro
      const recordKey = `${appointment.clientId}-${appointment.serviceId}-${appointment.startTime.toISOString()}`;

      // Verificar si ya existe un registro para este turno
      if (existingRecordsSet.has(recordKey)) {
        console.log(
          `⏭️  Saltando turno existente: ${appointment.client.name} - ${appointment.service.name} (${appointment.startTime.toISOString().split("T")[0]})`
        );
        skippedCount++;
        continue;
      }

      // Crear el registro de corte
      try {
        await prisma.haircutRecord.create({
          data: {
            clientId: appointment.clientId,
            serviceId: appointment.serviceId,
            staffId: appointment.staffId,
            date: appointment.startTime,
            price: appointment.service.price,
            notes: appointment.staffNotes || undefined,
            tags: [],
            photoUrls: [],
          },
        });

        console.log(
          `✅ Migrado: ${appointment.client.name} - ${appointment.service.name} (${appointment.startTime.toISOString().split("T")[0]})`
        );
        migratedCount++;
      } catch (error) {
        console.error(
          `❌ Error al migrar turno ${appointment.id}:`,
          error
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Migración completada!`);
    console.log(`✅ Registros migrados: ${migratedCount}`);
    console.log(`⏭️  Registros saltados (ya existían): ${skippedCount}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateCompletedAppointments()
  .then(() => {
    console.log("✅ Script finalizado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
