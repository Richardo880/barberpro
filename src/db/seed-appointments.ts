/**
 * Script para sembrar datos de ejemplo de appointments y business hours
 * Ejecutar con: tsx src/db/seed-appointments.ts
 */

import { PrismaClient, DayOfWeek } from '@prisma/client';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...\n');

  // 1. Configurar horarios de atención (si no existen)
  console.log('📅 Configurando horarios de atención...');

  const businessHoursData = [
    { dayOfWeek: DayOfWeek.MONDAY, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: DayOfWeek.TUESDAY, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: DayOfWeek.THURSDAY, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: DayOfWeek.FRIDAY, isOpen: true, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: DayOfWeek.SATURDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayOfWeek: DayOfWeek.SUNDAY, isOpen: false, openTime: '00:00', closeTime: '00:00' },
  ];

  for (const hours of businessHoursData) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: hours,
      create: hours,
    });
  }

  console.log('✅ Horarios de atención configurados');
  console.log('   Lunes a Jueves: 9:00 - 18:00');
  console.log('   Viernes: 9:00 - 20:00');
  console.log('   Sábado: 9:00 - 17:00');
  console.log('   Domingo: Cerrado\n');

  // 2. Obtener servicios y staff existentes
  const services = await prisma.service.findMany({ take: 3 });
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    include: { staffProfile: true },
  });

  if (services.length === 0) {
    console.log('⚠️  No hay servicios. Ejecuta primero: npm run db:seed\n');
    return;
  }

  if (staff.length === 0) {
    console.log('⚠️  No hay staff. Ejecuta primero: npm run db:seed\n');
    return;
  }

  console.log(`📋 Encontrados ${services.length} servicios y ${staff.length} staff members\n`);

  // 3. Obtener clientes existentes
  let clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    take: 5,
  });

  // Si no hay clientes, crear algunos de ejemplo
  if (clients.length === 0) {
    console.log('👥 Creando clientes de ejemplo...');

    const clientData = [
      { name: 'Juan Pérez', email: 'juan.perez@ejemplo.com' },
      { name: 'María García', email: 'maria.garcia@ejemplo.com' },
      { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com' },
      { name: 'Ana Martínez', email: 'ana.martinez@ejemplo.com' },
      { name: 'Luis Fernández', email: 'luis.fernandez@ejemplo.com' },
    ];

    for (const client of clientData) {
      const created = await prisma.user.create({
        data: {
          name: client.name,
          email: client.email,
          passwordHash: '$2a$12$dummy.hash.for.example.users.only', // Hash dummy
          role: 'CLIENT',
          clientProfile: {
            create: {
              tags: [],
            },
          },
        },
      });
      clients.push(created);
    }

    console.log(`✅ ${clients.length} clientes de ejemplo creados\n`);
  }

  // 4. Limpiar appointments antiguos de ejemplo
  await prisma.appointment.deleteMany({
    where: {
      client: {
        email: {
          contains: '@ejemplo.com',
        },
      },
    },
  });

  console.log('🗓️  Creando appointments de ejemplo para los próximos 7 días...\n');

  // 5. Crear appointments de ejemplo para los próximos 7 días
  const today = startOfDay(new Date());
  let appointmentCount = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = addDays(today, dayOffset);
    const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday

    // Saltar domingos
    if (dayOfWeek === 0) continue;

    // Crear 3-5 appointments por día
    const appointmentsPerDay = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < appointmentsPerDay; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const staffMember = staff[Math.floor(Math.random() * staff.length)];

      // Horarios variados: 9:00, 10:00, 11:00, 14:00, 15:00, 16:00
      const possibleHours = [9, 10, 11, 14, 15, 16];
      const hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
      const minute = Math.random() > 0.5 ? 0 : 30;

      const startTime = setMinutes(setHours(currentDay, hour), minute);
      const endTime = addDays(startTime, 0);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      // Verificar que no haya conflicto
      const conflict = await prisma.appointment.findFirst({
        where: {
          staffId: staffMember.id,
          startTime: {
            lte: endTime,
          },
          endTime: {
            gte: startTime,
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      });

      if (!conflict) {
        // Variar estados
        const statuses = ['PENDING', 'CONFIRMED', 'CONFIRMED', 'COMPLETED'];
        const status = dayOffset === 0
          ? 'COMPLETED' // Hoy ya completados
          : statuses[Math.floor(Math.random() * statuses.length)];

        await prisma.appointment.create({
          data: {
            clientId: client.id,
            serviceId: service.id,
            staffId: staffMember.id,
            startTime,
            endTime,
            status: status as any,
            clientNotes: i % 2 === 0 ? 'Corte como la última vez' : undefined,
          },
        });

        appointmentCount++;
      }
    }
  }

  console.log(`✅ ${appointmentCount} appointments creados para los próximos 7 días\n`);

  // 6. Mostrar resumen
  const summary = await prisma.appointment.groupBy({
    by: ['status'],
    _count: true,
    where: {
      startTime: {
        gte: today,
      },
    },
  });

  console.log('📊 Resumen de appointments:');
  summary.forEach((s) => {
    console.log(`   ${s.status}: ${s._count} turnos`);
  });

  console.log('\n✨ ¡Datos sembrados exitosamente!\n');
  console.log('Próximos pasos:');
  console.log('1. Inicia el servidor: npm run dev');
  console.log('2. Ve a: http://localhost:3000/mi-cuenta/nueva-reserva');
  console.log('3. Selecciona un servicio, staff y fecha');
  console.log('4. Deberías ver slots disponibles y ocupados\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
