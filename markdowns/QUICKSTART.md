# 🚀 QUICKSTART - BarberPro

Guía rápida para tener el proyecto funcionando en **10 minutos**.

---

## ✅ Pre-requisitos

- Node.js 20+ instalado
- Docker Desktop instalado (o PostgreSQL 15+)
- Terminal/CMD

---

## 📦 PASO 1: Crear Proyecto Next.js

```bash
# Crear nuevo proyecto Next.js
npx create-next-app@latest barberpro --typescript --tailwind --app --src-dir --import-alias "@/*"

# Navegar al proyecto
cd barberpro
```

Cuando pregunte, selecciona:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: Yes
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

---

## 📋 PASO 2: Copiar Archivos de Configuración

```bash
# Volver a la carpeta barberia original
cd ..

# Copiar package.json
cp barberia/package.new.json barberpro/package.json

# Copiar configuraciones
cp barberia/next.config.new.js barberpro/next.config.js
cp barberia/tsconfig.new.json barberpro/tsconfig.json
cp barberia/.gitignore.new barberpro/.gitignore
cp barberia/.env.example barberpro/.env.local

# Copiar Docker
cp barberia/docker-compose.yml barberpro/
mkdir -p barberpro/docker
cp barberia/docker/Dockerfile barberpro/docker/

# Copiar toda la estructura src/
cp -r barberia/src/db barberpro/src/
cp -r barberia/src/lib barberpro/src/
cp -r barberia/src/server barberpro/src/
cp -r barberia/src/types barberpro/src/
cp barberia/src/middleware.ts barberpro/src/

# Copiar API routes
mkdir -p barberpro/src/app/api/appointments/available-slots
cp barberia/src/app/api/appointments/available-slots/route.ts barberpro/src/app/api/appointments/available-slots/

# Ir al nuevo proyecto
cd barberpro
```

---

## 📦 PASO 3: Instalar Dependencias

```bash
npm install
```

**Tiempo estimado:** 2-3 minutos

---

## 🔐 PASO 4: Configurar Variables de Entorno

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Editar .env.local y pegar el secret
# Reemplazar "genera-un-secret..." con el valor generado
```

Tu `.env.local` debe tener al menos:

```env
DATABASE_URL="postgresql://barberpro:password@localhost:5432/barberpro"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<el-secret-que-generaste>"
```

---

## 🐳 PASO 5: Levantar Base de Datos

```bash
# Iniciar PostgreSQL con Docker
docker-compose up -d postgres

# Esperar 10 segundos a que inicie
sleep 10

# Verificar que esté corriendo
docker-compose ps
```

Deberías ver:
```
NAME              COMMAND                  SERVICE    STATUS
barberpro-db      "docker-entrypoint.s…"   postgres   Up
```

---

## 🗄️ PASO 6: Crear Base de Datos

```bash
# Generar Prisma Client
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init

# Ejecutar seed (poblar con datos de ejemplo)
npx prisma db seed
```

**Deberías ver:**

```
✅ SEED COMPLETADO EXITOSAMENTE

📊 RESUMEN DE DATOS CREADOS:
  • 5 usuarios (1 admin + 2 staff + 2 clientes)
  • 5 servicios
  • 2 turnos
  • 2 registros históricos
  ...

🔑 CREDENCIALES DE ACCESO:

  👨‍💼 ADMIN:
     Email: admin@barberpro.com
     Password: Admin123!

  ✂️  STAFF (Barberos):
     Email: carlos@barberpro.com
     Password: User123!

  👤 CLIENTES:
     Email: juan@example.com
     Password: User123!
```

---

## 🔍 PASO 7: Explorar Base de Datos (Opcional)

```bash
npx prisma studio
```

Abre http://localhost:5555 en tu navegador para ver todos los datos.

**Explora:**
- Tabla `users` - 5 usuarios creados
- Tabla `services` - 5 servicios
- Tabla `appointments` - 2 turnos de ejemplo
- Tabla `haircut_records` - 2 registros históricos

---

## 🎨 PASO 8: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

**Deberías ver:**
- Página de inicio de Next.js por defecto (aún no hay UI implementado)

---

## ✅ VERIFICACIÓN

Tu proyecto está listo si:

- ✅ PostgreSQL corriendo en Docker
- ✅ Base de datos creada con 11 tablas
- ✅ 5 usuarios seeded (admin, 2 staff, 2 clientes)
- ✅ Next.js corriendo en localhost:3000
- ✅ Prisma Studio funciona en localhost:5555

---

## 🎯 PRÓXIMOS PASOS

Ahora tienes el **backend completo funcionando**. Falta implementar el frontend.

### Opción 1: Seguir el plan de ARCHITECTURE.md

Lee `ARCHITECTURE.md` sección 5 (Pantallas y Rutas) e implementa página por página:

1. **Páginas públicas** (2-3 días):
   - `src/app/(public)/page.tsx` - Home
   - `src/app/(public)/servicios/page.tsx`
   - `src/app/(public)/galeria/page.tsx`
   - `src/app/(public)/contacto/page.tsx`

2. **Autenticación** (1-2 días):
   - `src/app/(auth)/login/page.tsx`
   - `src/app/(auth)/registro/page.tsx`
   - Configurar NextAuth route handler

3. **Dashboard Cliente** (2-3 días):
   - `src/app/(dashboard)/mi-cuenta/page.tsx`
   - `src/app/(dashboard)/mi-cuenta/reservas/page.tsx`
   - `src/app/(dashboard)/mi-cuenta/nueva-reserva/page.tsx`

4. **Panel Admin** (3-5 días):
   - `src/app/(dashboard)/admin/page.tsx`
   - `src/app/(dashboard)/admin/clientes/page.tsx`
   - `src/app/(dashboard)/admin/turnos/page.tsx`

### Opción 2: Usar shadcn/ui para UI

```bash
# Instalar shadcn/ui
npx shadcn-ui@latest init

# Agregar componentes
npx shadcn-ui@latest add button card input form select dialog table badge avatar calendar toast tabs
```

### Opción 3: Migrar desde proyecto actual

Sigue `MIGRATION.md` para migrar componentes existentes.

---

## 🧪 TESTEAR API

Puedes probar el endpoint de slots disponibles:

```bash
curl -X POST http://localhost:3000/api/appointments/available-slots \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "clx...",
    "date": "2026-01-10"
  }'
```

(Reemplaza `clx...` con un ID real de servicio desde Prisma Studio)

---

## 🛠️ COMANDOS ÚTILES

```bash
# Ver logs de Docker
docker-compose logs -f postgres

# Parar todo
docker-compose down

# Resetear BD (CUIDADO: borra todo)
npx prisma migrate reset

# Re-ejecutar seed
npx prisma db seed

# TypeScript check
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

---

## 🐛 PROBLEMAS COMUNES

### Error: "Can't reach database server"

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Si no está, iniciarlo
docker-compose up -d postgres
```

### Error: "NEXTAUTH_SECRET missing"

```bash
# Generar nuevo secret
openssl rand -base64 32

# Agregarlo a .env.local
echo 'NEXTAUTH_SECRET="tu-secret-aqui"' >> .env.local
```

### Error: "Module not found: @prisma/client"

```bash
npx prisma generate
```

### Error en Windows con Docker

- Asegurate de tener Docker Desktop corriendo
- Habilita WSL 2 backend en Docker Settings

---

## 📚 DOCUMENTACIÓN

- `ARCHITECTURE.md` - Arquitectura completa (LEE ESTO)
- `MIGRATION.md` - Guía de migración
- `START_HERE.md` - Opciones de implementación
- `README.new.md` - README del proyecto
- `LOG.md` - Registro de todo lo creado

---

## 🎉 ¡LISTO!

Tienes:
- ✅ Backend completo con PostgreSQL + Prisma
- ✅ Autenticación configurada (NextAuth)
- ✅ API de disponibilidad funcionando
- ✅ Base de datos con datos de ejemplo
- ✅ Docker setup listo
- ✅ Validaciones Zod completas
- ✅ Utils helpers (20+ funciones)
- ✅ TypeScript configurado

**Ahora solo falta construir el frontend según `ARCHITECTURE.md`**

---

**Tiempo total:** ~10 minutos ⏱️

**¡A desarrollar! 🚀**
