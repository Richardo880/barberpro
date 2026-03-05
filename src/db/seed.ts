/**
 * Seed Script para BarberPro
 * Pobla la base de datos con datos de ejemplo
 */

import { PrismaClient, Role, AppointmentStatus, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // ============================================
  // 1. CREAR USUARIOS
  // ============================================
  console.log('👥 Creando usuarios...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword = await bcrypt.hash('User123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@barberpro.com' },
    update: {},
    create: {
      email: 'admin@barberpro.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      name: 'Administrador',
      phone: '+595981000001',
    },
  });
  console.log('  ✓ Admin creado:', admin.email);

  const staff1 = await prisma.user.upsert({
    where: { email: 'carlos@barberpro.com' },
    update: {},
    create: {
      email: 'carlos@barberpro.com',
      passwordHash: userPassword,
      role: Role.STAFF,
      name: 'Carlos Rodriguez',
      phone: '+595981000002',
      staffProfile: {
        create: {
          bio: '10 años de experiencia en cortes clásicos y modernos. Especialista en fades y diseños.',
          photoUrl: null,
          specialties: ['fade', 'barba', 'diseño'],
          isActive: true,
        },
      },
    },
    include: {
      staffProfile: true,
    },
  });
  console.log('  ✓ Staff creado:', staff1.email);

  const staff2 = await prisma.user.upsert({
    where: { email: 'pedro@barberpro.com' },
    update: {},
    create: {
      email: 'pedro@barberpro.com',
      passwordHash: userPassword,
      role: Role.STAFF,
      name: 'Pedro Martínez',
      phone: '+595981000003',
      staffProfile: {
        create: {
          bio: 'Experto en cortes clásicos y cuidado de barba. 8 años en el rubro.',
          photoUrl: null,
          specialties: ['clásico', 'barba', 'niños'],
          isActive: true,
        },
      },
    },
    include: {
      staffProfile: true,
    },
  });
  console.log('  ✓ Staff creado:', staff2.email);

  const client1 = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      passwordHash: userPassword,
      role: Role.CLIENT,
      name: 'Juan Pérez',
      phone: '+595981123456',
      birthDate: new Date('1990-05-15'),
      clientProfile: {
        create: {
          internalNotes: 'Cliente VIP, siempre puntual. Prefiere cortes con máquina #2 en los lados.',
          tags: ['VIP', 'frequent', 'puntual'],
        },
      },
    },
    include: {
      clientProfile: true,
    },
  });
  console.log('  ✓ Cliente creado:', client1.email);

  const client2 = await prisma.user.upsert({
    where: { email: 'maria@example.com' },
    update: {},
    create: {
      email: 'maria@example.com',
      passwordHash: userPassword,
      role: Role.CLIENT,
      name: 'María López',
      phone: '+595981654321',
      birthDate: new Date('1995-08-20'),
      clientProfile: {
        create: {
          tags: ['nuevo'],
        },
      },
    },
    include: {
      clientProfile: true,
    },
  });
  console.log('  ✓ Cliente creado:', client2.email);

  // ============================================
  // 2. CREAR SERVICIOS
  // ============================================
  console.log('\n✂️  Creando servicios...');

  const servicios = [
    {
      name: 'Corte Clásico',
      description: 'Corte tradicional con tijera y máquina. Incluye lavado y secado.',
      duration: 30,
      price: 80000,
    },
    {
      name: 'Fade Moderno',
      description: 'Degradado completo con diseño personalizado. Ideal para estilos modernos.',
      duration: 45,
      price: 100000,
    },
    {
      name: 'Barba',
      description: 'Arreglo y perfilado de barba con máquina y navaja. Incluye productos de cuidado.',
      duration: 20,
      price: 50000,
    },
    {
      name: 'Combo Fade + Barba',
      description: 'Servicio completo: degradado moderno + arreglo de barba.',
      duration: 60,
      price: 140000,
    },
    {
      name: 'Corte Niños',
      description: 'Corte especial para menores de 12 años. Rápido y cómodo.',
      duration: 20,
      price: 50000,
    },
  ];

  const createdServices = [];
  for (const svc of servicios) {
    const service = await prisma.service.upsert({
      where: { name: svc.name },
      update: {},
      create: svc,
    });
    createdServices.push(service);
    console.log(`  ✓ Servicio: ${service.name} - ${service.price} Gs`);
  }

  // ============================================
  // 3. ASIGNAR SERVICIOS A STAFF
  // ============================================
  console.log('\n🔗 Asignando servicios a barberos...');

  // Carlos puede hacer todos los servicios
  await prisma.staffProfile.update({
    where: { userId: staff1.id },
    data: {
      services: {
        connect: createdServices.map((s) => ({ id: s.id })),
      },
    },
  });
  console.log(`  ✓ Carlos Rodriguez → Todos los servicios`);

  // Pedro puede hacer solo los primeros 3 + corte niños
  await prisma.staffProfile.update({
    where: { userId: staff2.id },
    data: {
      services: {
        connect: [
          { id: createdServices[0].id }, // Corte Clásico
          { id: createdServices[2].id }, // Barba
          { id: createdServices[4].id }, // Corte Niños
        ],
      },
    },
  });
  console.log(`  ✓ Pedro Martínez → Corte Clásico, Barba, Corte Niños`);

  // ============================================
  // 4. CONFIGURAR HORARIOS DE ATENCIÓN
  // ============================================
  console.log('\n⏰ Configurando horarios de atención...');

  const businessHoursData = [
    { dayOfWeek: DayOfWeek.MONDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.TUESDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.WEDNESDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.THURSDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.FRIDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.SATURDAY, isOpen: true, openTime: '09:00', closeTime: '21:00' },
    { dayOfWeek: DayOfWeek.SUNDAY, isOpen: false, openTime: '00:00', closeTime: '00:00' },
  ];

  for (const bh of businessHoursData) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: bh.dayOfWeek },
      update: bh,
      create: bh,
    });
    console.log(`  ✓ ${bh.dayOfWeek}: ${bh.isOpen ? `${bh.openTime} - ${bh.closeTime}` : 'CERRADO'}`);
  }

  // ============================================
  // 5. CREAR TURNOS DE EJEMPLO
  // ============================================
  console.log('\n📅 Creando turnos de ejemplo...');

  // Turno para mañana a las 10:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      serviceId: createdServices[0].id, // Corte Clásico
      staffId: staff1.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000), // +30 min
      status: AppointmentStatus.CONFIRMED,
      clientNotes: 'Sin flequillo, máquina #2 en los lados',
    },
  });
  console.log(`  ✓ Turno confirmado: ${client1.name} → ${createdServices[0].name} (mañana 10:00)`);

  // Turno para pasado mañana a las 14:00
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(14, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      clientId: client2.id,
      serviceId: createdServices[3].id, // Combo Fade + Barba
      staffId: staff1.id,
      startTime: dayAfterTomorrow,
      endTime: new Date(dayAfterTomorrow.getTime() + 60 * 60000), // +60 min
      status: AppointmentStatus.PENDING,
      clientNotes: 'Primera vez, quiero cambiar de look',
    },
  });
  console.log(`  ✓ Turno pendiente: ${client2.name} → ${createdServices[3].name} (pasado mañana 14:00)`);

  // ============================================
  // 6. CREAR REGISTROS HISTÓRICOS
  // ============================================
  console.log('\n📸 Creando registros históricos de cortes...');

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await prisma.haircutRecord.create({
    data: {
      clientId: client1.id,
      serviceId: createdServices[1].id, // Fade Moderno
      staffId: staff1.id,
      date: lastMonth,
      price: 100000,
      notes: 'Fade alto con diseño de líneas laterales. Cliente muy satisfecho.',
      tags: ['fade alto', 'diseño líneas', 'excelente resultado'],
      photoUrls: ['/images/records/example1.jpg', '/images/records/example1_detail.jpg'],
    },
  });
  console.log(`  ✓ Registro creado: ${client1.name} - ${createdServices[1].name} (mes pasado)`);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  await prisma.haircutRecord.create({
    data: {
      clientId: client1.id,
      serviceId: createdServices[2].id, // Barba
      staffId: staff2.id,
      date: twoWeeksAgo,
      price: 50000,
      notes: 'Arreglo de barba con navaja. Cliente prefiere estilo corto y prolijo.',
      tags: ['barba corta', 'navaja', 'estilo ejecutivo'],
      photoUrls: [],
    },
  });
  console.log(`  ✓ Registro creado: ${client1.name} - ${createdServices[2].name} (hace 2 semanas)`);

  // ============================================
  // 7. CONFIGURACIÓN DE APP
  // ============================================
  console.log('\n⚙️  Configurando parámetros de la app...');

  await prisma.appConfig.upsert({
    where: { key: 'buffer_time_minutes' },
    update: { value: '10' },
    create: {
      key: 'buffer_time_minutes',
      value: '10',
      type: 'number',
      description: 'Tiempo de buffer entre turnos consecutivos (en minutos)',
    },
  });
  console.log('  ✓ Buffer entre turnos: 10 minutos');

  await prisma.appConfig.upsert({
    where: { key: 'max_advance_booking_days' },
    update: { value: '30' },
    create: {
      key: 'max_advance_booking_days',
      value: '30',
      type: 'number',
      description: 'Máximo de días de anticipación para reservar (en días)',
    },
  });
  console.log('  ✓ Anticipación máxima de reserva: 30 días');

  await prisma.appConfig.upsert({
    where: { key: 'cancel_hours_before' },
    update: { value: '24' },
    create: {
      key: 'cancel_hours_before',
      value: '24',
      type: 'number',
      description: 'Horas mínimas antes del turno para poder cancelar (en horas)',
    },
  });
  console.log('  ✓ Cancelación permitida hasta: 24 horas antes');

  // Configuración de promoción
  await prisma.appConfig.upsert({
    where: { key: 'promo_enabled' },
    update: {},
    create: {
      key: 'promo_enabled',
      value: 'true',
      type: 'boolean',
      description: 'Habilitar/deshabilitar promoción semanal',
    },
  });

  await prisma.appConfig.upsert({
    where: { key: 'promo_day' },
    update: {},
    create: {
      key: 'promo_day',
      value: '3',
      type: 'number',
      description: 'Día de la semana para la promoción (0=Domingo, 3=Miércoles)',
    },
  });

  await prisma.appConfig.upsert({
    where: { key: 'promo_discount' },
    update: {},
    create: {
      key: 'promo_discount',
      value: '10000',
      type: 'number',
      description: 'Monto del descuento en guaraníes',
    },
  });

  await prisma.appConfig.upsert({
    where: { key: 'promo_message' },
    update: {},
    create: {
      key: 'promo_message',
      value: '¡Miércoles de Promo! Cortes seleccionados con ₲10.000 de descuento',
      type: 'string',
      description: 'Mensaje a mostrar en el banner de promoción',
    },
  });

  await prisma.appConfig.upsert({
    where: { key: 'promo_service_ids' },
    update: {},
    create: {
      key: 'promo_service_ids',
      value: JSON.stringify([createdServices[0].id, createdServices[1].id]),
      type: 'json',
      description: 'IDs de servicios que tienen promoción',
    },
  });
  console.log('  ✓ Promoción configurada: Miércoles con ₲10.000 de descuento');

  // ============================================
  // 8. CREAR CIERRE EXCEPCIONAL DE EJEMPLO
  // ============================================
  console.log('\n🚫 Creando cierre excepcional de ejemplo...');

  const newYear = new Date('2026-01-01');
  await prisma.closure.upsert({
    where: { id: 'closure_new_year_2026' },
    update: {},
    create: {
      id: 'closure_new_year_2026',
      date: newYear,
      reason: 'Año Nuevo',
      isAllDay: true,
    },
  });
  console.log('  ✓ Cierre: 2026-01-01 (Año Nuevo)');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('='.repeat(50));

  console.log('\n📊 RESUMEN DE DATOS CREADOS:');
  console.log(`  • ${await prisma.user.count()} usuarios (1 admin + 2 staff + 2 clientes)`);
  console.log(`  • ${await prisma.service.count()} servicios`);
  console.log(`  • ${await prisma.appointment.count()} turnos`);
  console.log(`  • ${await prisma.haircutRecord.count()} registros históricos`);
  console.log(`  • ${await prisma.businessHours.count()} configuraciones de horario`);
  console.log(`  • ${await prisma.closure.count()} cierres excepcionales`);
  console.log(`  • ${await prisma.appConfig.count()} configuraciones de app`);

  console.log('\n🔑 CREDENCIALES DE ACCESO:');
  console.log('\n  👨‍💼 ADMIN:');
  console.log('     Email: admin@barberpro.com');
  console.log('     Password: Admin123!');

  console.log('\n  ✂️  STAFF (Barberos):');
  console.log('     Email: carlos@barberpro.com');
  console.log('     Password: User123!');
  console.log('     ---');
  console.log('     Email: pedro@barberpro.com');
  console.log('     Password: User123!');

  console.log('\n  👤 CLIENTES:');
  console.log('     Email: juan@example.com');
  console.log('     Password: User123!');
  console.log('     ---');
  console.log('     Email: maria@example.com');
  console.log('     Password: User123!');

  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('  1. Ejecuta: npx prisma studio');
  console.log('  2. Abre http://localhost:5555 para explorar los datos');
  console.log('  3. Ejecuta: npm run dev');
  console.log('  4. Implementa las páginas según ARCHITECTURE.md');

  console.log('\n🎉 ¡Listo para desarrollar!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR EN SEED:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
