#!/usr/bin/env node

/**
 * Script para verificar la configuración de autenticación
 * Ejecutar con: node scripts/check-auth-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de autenticación...\n');

let hasErrors = false;

// 1. Verificar archivo .env.local
console.log('📄 Verificando .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ ERROR: .env.local no existe');
  console.log('   Solución: Copia .env a .env.local y configura las variables\n');
  hasErrors = true;
} else {
  console.log('✅ .env.local existe');

  const envContent = fs.readFileSync(envPath, 'utf-8');

  // Verificar variables requeridas
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];

  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+$`, 'm');
    const match = envContent.match(regex);

    if (!match || match[0].includes('=\n') || match[0].includes('=""')) {
      console.log(`❌ ${varName} no está configurado o está vacío`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} está configurado`);
    }
  });

  // Verificar variables opcionales de Google
  const hasGoogleId = /^GOOGLE_CLIENT_ID=.+$/m.test(envContent) && !envContent.includes('GOOGLE_CLIENT_ID=""');
  const hasGoogleSecret = /^GOOGLE_CLIENT_SECRET=.+$/m.test(envContent) && !envContent.includes('GOOGLE_CLIENT_SECRET=""');

  if (hasGoogleId && hasGoogleSecret) {
    console.log('✅ Google OAuth está configurado');
  } else {
    console.log('⚠️  Google OAuth NO está configurado (opcional)');
    console.log('   Para configurarlo, sigue: docs/GOOGLE_OAUTH_SETUP.md');
  }
}

console.log('');

// 2. Verificar conexión a base de datos
console.log('🗄️  Verificando base de datos...');

try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  (async () => {
    try {
      await prisma.$connect();
      console.log('✅ Conexión a PostgreSQL exitosa');

      // Verificar que existan las tablas
      const userCount = await prisma.user.count();
      console.log(`✅ Tabla 'users' existe (${userCount} usuarios)`);

      const profileCount = await prisma.clientProfile.count();
      console.log(`✅ Tabla 'client_profiles' existe (${profileCount} perfiles)`);

      await prisma.$disconnect();

      console.log('');

      // Resumen final
      if (!hasErrors) {
        console.log('✅ ¡Configuración de autenticación correcta!');
        console.log('');
        console.log('Próximos pasos:');
        console.log('1. npm run dev             - Iniciar servidor de desarrollo');
        console.log('2. http://localhost:3000   - Abrir la aplicación');
        console.log('3. /registro               - Crear una cuenta de prueba');
        console.log('');
        console.log('Para testing detallado, consulta: docs/TESTING_AUTH.md');
      } else {
        console.log('❌ Hay errores en la configuración');
        console.log('');
        console.log('Soluciones:');
        console.log('1. Revisa el archivo .env.local');
        console.log('2. Ejecuta: npm run db:migrate');
        console.log('3. Consulta: docs/TROUBLESHOOTING_AUTH.md');
      }

      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.log('❌ Error al conectar a la base de datos');
      console.log(`   ${error.message}`);
      console.log('');
      console.log('Soluciones:');
      console.log('1. Verifica que PostgreSQL esté ejecutándose');
      console.log('2. Verifica DATABASE_URL en .env.local');
      console.log('3. Ejecuta: npm run db:migrate');
      console.log('');
      console.log('Para más ayuda: docs/TROUBLESHOOTING_AUTH.md');

      await prisma.$disconnect();
      process.exit(1);
    }
  })();
} catch (error) {
  console.log('❌ Error al cargar Prisma Client');
  console.log('   Solución: Ejecuta npm run db:generate');
  console.log('');
  process.exit(1);
}
