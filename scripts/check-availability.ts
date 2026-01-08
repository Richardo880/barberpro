/**
 * Script para verificar el estado de la disponibilidad
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando configuración de disponibilidad...\n');

  // 1. Verificar business_hours
  const businessHours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: 'asc' },
  });

  console.log('📅 Horarios de atención:');
  if (businessHours.length === 0) {
    console.log('   ❌ No hay horarios configurados');
    console.log('   👉 Ejecuta: npm run db:seed:appointments\n');
  } else {
    businessHours.forEach((hours) => {
      const status = hours.isOpen
        ? `✅ ${hours.openTime} - ${hours.closeTime}`
        : '❌ Cerrado';
      console.log(`   ${hours.dayOfWeek}: ${status}`);
    });
    console.log('');
  }

  // 2. Verificar servicios
  const services = await prisma.service.findMany({
    where: { isActive: true },
  });

  console.log('✂️  Servicios activos:');
  if (services.length === 0) {
    console.log('   ❌ No hay servicios');
    console.log('   👉 Ejecuta: npm run db:seed\n');
  } else {
    services.forEach((service) => {
      console.log(
        `   ✅ ${service.name} (${service.duration} min - ₲${service.price})`
      );
    });
    console.log('');
  }

  // 3. Verificar staff
  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    include: { staffProfile: true },
  });

  console.log('👨‍💼 Staff disponible:');
  if (staff.length === 0) {
    console.log('   ❌ No hay staff');
    console.log('   👉 Ejecuta: npm run db:seed\n');
  } else {
    staff.forEach((member) => {
      const status = member.staffProfile?.isActive ? '✅' : '❌';
      console.log(`   ${status} ${member.name}`);
    });
    console.log('');
  }

  // 4. Verificar appointments próximos
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: today,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  });

  console.log('📋 Próximos appointments:');
  if (upcomingAppointments.length === 0) {
    console.log('   ℹ️  No hay appointments próximos');
    console.log('   (Esto es normal si aún no se han creado reservas)\n');
  } else {
    upcomingAppointments.forEach((apt) => {
      console.log(
        `   📅 ${apt.startTime.toLocaleDateString()} ${apt.startTime.toLocaleTimeString()} - ${apt.status}`
      );
    });
    console.log('');
  }

  // 5. Verificar appointments de ejemplo
  const exampleAppointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: today,
      },
    },
  });

  console.log('📊 Total appointments desde hoy:', exampleAppointments.length);

  if (exampleAppointments.length === 0) {
    console.log(
      '   ℹ️  Ejecuta "npm run db:seed:appointments" para crear datos de ejemplo\n'
    );
  }

  // Resumen
  console.log('\n✨ Resumen:');
  const issues = [];

  if (businessHours.length === 0) {
    issues.push('❌ Faltan horarios de atención');
  }
  if (services.length === 0) {
    issues.push('❌ Faltan servicios');
  }
  if (staff.length === 0) {
    issues.push('❌ Falta staff');
  }

  if (issues.length > 0) {
    console.log('   Problemas encontrados:');
    issues.forEach((issue) => console.log(`   ${issue}`));
    console.log('\n   👉 Solución:');
    console.log('   1. npm run db:seed (servicios y staff)');
    console.log('   2. npm run db:seed:appointments (horarios y appointments)\n');
  } else {
    console.log('   ✅ Configuración básica completa');
    console.log(
      `   📅 ${businessHours.length} días configurados, ${services.length} servicios, ${staff.length} staff`
    );
    console.log(`   📋 ${exampleAppointments.length} appointments desde hoy\n`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
