# Guía de Migración - BarberPro

Este documento explica cómo migrar del proyecto actual (Vite + React + localStorage) al nuevo stack (Next.js 15 + PostgreSQL + Prisma).

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Framework** | Vite + React | Next.js 15 (App Router) |
| **Routing** | React Router (HashRouter) | Next.js App Router |
| **Database** | localStorage (mock) | PostgreSQL + Prisma |
| **Auth** | Custom context + localStorage | NextAuth (JWT) |
| **Estado** | React Context | TanStack Query + Server State |
| **Styling** | Tailwind CSS | Tailwind CSS + shadcn/ui |
| **Deploy** | Static hosting | Vercel/Railway/Docker |

---

## 🔄 Migración Paso a Paso

### Fase 1: Setup del Nuevo Proyecto (1-2 días)

1. **Inicializar proyecto Next.js**

```bash
# Crear nuevo proyecto Next.js
npx create-next-app@latest barberpro-new --typescript --tailwind --app

cd barberpro-new

# Copiar archivos de configuración del repo
cp ../barberia/package.new.json ./package.json
cp ../barberia/next.config.new.js ./next.config.js
cp ../barberia/.env.example ./.env.local

# Instalar dependencias
npm install
```

2. **Setup de Prisma y Base de Datos**

```bash
# Copiar Prisma schema
mkdir -p src/db
cp ../barberia/src/db/schema.prisma ./src/db/

# Crear database (con Docker)
cp ../barberia/docker-compose.yml ./
docker-compose up -d postgres

# Ejecutar migraciones
npx prisma migrate dev --name init

# Seed de datos
cp ../barberia/src/db/seed.ts ./src/db/
npm run db:seed
```

3. **Configurar NextAuth**

```bash
# Copiar configuración de auth
cp ../barberia/src/lib/auth.ts ./src/lib/
cp ../barberia/src/lib/prisma.ts ./src/lib/

# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Agregar a .env.local:
# NEXTAUTH_SECRET="<el-secret-generado>"
```

### Fase 2: Migración de Datos (1 día)

Si tienes usuarios/datos reales en localStorage del proyecto actual, necesitas migrarlos:

**Script de migración** (`scripts/migrate-localstorage.ts`):

```typescript
/**
 * Script para migrar datos de localStorage a PostgreSQL
 * Ejecutar en el navegador con el proyecto viejo abierto
 */

// 1. Exportar datos de localStorage
const exportData = () => {
  const data = {
    users: JSON.parse(localStorage.getItem('barber_users') || '[]'),
    services: JSON.parse(localStorage.getItem('barber_services') || '[]'),
    staff: JSON.parse(localStorage.getItem('barber_staff') || '[]'),
    appointments: JSON.parse(localStorage.getItem('barber_appointments') || '[]'),
    reviews: JSON.parse(localStorage.getItem('barber_reviews') || '[]'),
  };

  // Descargar como JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'barberpro-export.json';
  a.click();
};

exportData();
```

**Importar a PostgreSQL:**

```typescript
// src/db/import-from-old.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import oldData from './barberpro-export.json';

async function importOldData() {
  // 1. Importar usuarios
  for (const user of oldData.users) {
    const passwordHash = await bcrypt.hash(user.password || 'ChangeMe123!', 12);

    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        phone: user.phone,
      },
    });
  }

  // 2. Importar servicios
  for (const service of oldData.services) {
    await prisma.service.create({
      data: {
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
      },
    });
  }

  // ... continuar con staff, appointments, etc.
}

importOldData();
```

### Fase 3: Migrar Componentes UI (3-5 días)

1. **Instalar shadcn/ui**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form select dialog table badge avatar calendar toast tabs
```

2. **Migrar componentes uno por uno**

**Mapeo de componentes:**

| Viejo (src/) | Nuevo (src/components/) |
|--------------|-------------------------|
| `components/ui/Button.tsx` | → Usar `components/ui/button.tsx` (shadcn) |
| `components/Layout.tsx` | → `components/layout/public-navbar.tsx` |
| `pages/Home.tsx` | → `app/(public)/page.tsx` |
| `pages/Dashboard.tsx` | → `app/(dashboard)/mi-cuenta/page.tsx` |
| `pages/BookingWizard.tsx` | → `components/appointments/booking-wizard.tsx` |
| `pages/AdminPanel.tsx` | → `app/(dashboard)/admin/page.tsx` |

**Ejemplo de migración:**

Antes (`pages/Home.tsx`):
```tsx
// React Router + Hash
export function Home() {
  return (
    <Layout>
      <div>Home content...</div>
    </Layout>
  );
}
```

Después (`app/(public)/page.tsx`):
```tsx
// Next.js App Router (Server Component)
export default function HomePage() {
  return (
    <div>Home content...</div>
  );
}
```

3. **Migrar lógica de datos**

Antes (localStorage):
```tsx
const services = dataService.getServices(); // Síncrono, localStorage
```

Después (PostgreSQL + TanStack Query):
```tsx
'use client'; // Client Component para hooks

import { useQuery } from '@tanstack/react-query';

export function ServicesPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      return res.json();
    },
  });

  if (isLoading) return <Skeleton />;

  return <ServicesList services={services} />;
}
```

### Fase 4: Migrar API/Backend (2-3 días)

1. **Crear API Routes**

Mapeo de servicios a API routes:

| Viejo (services/mockDb.ts) | Nuevo (app/api/) |
|----------------------------|------------------|
| `authService.login()` | NextAuth (automático) |
| `dataService.getServices()` | `app/api/services/route.ts` |
| `dataService.getAppointments()` | `app/api/appointments/route.ts` |
| `dataService.createAppointment()` | `app/api/appointments/route.ts` (POST) |

**Ejemplo:**

Antes (`services/mockDb.ts`):
```typescript
export const dataService = {
  getAppointments: async (userId?: string, role?: Role) => {
    const appointments = getFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS);
    // ... lógica de filtrado
    return appointments;
  }
};
```

Después (`app/api/appointments/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: session.user.role === 'CLIENT' ? { clientId: session.user.id } : {},
    include: { service: true, client: true, staff: true },
  });

  return NextResponse.json({ appointments });
}
```

2. **Crear Services Layer**

Copiar los ejemplos del repo:
```bash
cp ../barberia/src/server/services/* ./src/server/services/
```

### Fase 5: Migrar Páginas Protegidas (2 días)

1. **Setup Middleware**

```bash
cp ../barberia/src/middleware.ts ./src/
```

2. **Convertir páginas de dashboard**

Antes (React Router):
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

Después (Next.js App Router):
```
src/app/(dashboard)/mi-cuenta/page.tsx  ← Protegido por middleware automáticamente
```

### Fase 6: Migrar Estilos de Wix (1-2 días)

**Extraer colores y tipografías de los HTML de Wix:**

1. Inspeccionar `pages_barberia/*.html` para CSS custom
2. Actualizar `tailwind.config.ts`:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A6AFF', // Extraer del Wix
          50: '#E6F0FF',
          // ... otros tonos
        },
      },
      fontFamily: {
        sans: ['Madefor', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
};
```

3. Copiar imágenes/assets:

```bash
# Copiar imágenes de Wix a /public
cp -r ../barberia/pages_barberia/*/images/* ./public/images/
```

### Fase 7: Testing y QA (2-3 días)

1. **Testing funcional:**
   - [ ] Registro de usuario
   - [ ] Login
   - [ ] Crear reserva
   - [ ] Cancelar reserva
   - [ ] Admin: confirmar turno
   - [ ] Admin: ver métricas

2. **Testing de migración:**
   - [ ] Todos los usuarios migrados correctamente
   - [ ] Reservas históricas presentes
   - [ ] Permisos funcionando (CLIENT vs ADMIN)

3. **Performance:**
   - [ ] Lighthouse score > 85
   - [ ] Todas las páginas cargan en < 2s

### Fase 8: Deploy (1 día)

1. **Deploy a staging (Vercel):**

```bash
vercel
```

2. **Migrar base de datos de producción** (si existe data real)
3. **Deploy a producción**
4. **Configurar dominio**

---

## 📋 Checklist de Migración

### Backend/Database
- [ ] PostgreSQL configurado
- [ ] Prisma schema migrado
- [ ] Seed de datos ejecutado
- [ ] Datos de localStorage importados (si aplica)
- [ ] NextAuth configurado

### Frontend
- [ ] shadcn/ui instalado
- [ ] Todas las páginas públicas migradas
- [ ] Dashboard de cliente migrado
- [ ] Panel admin migrado
- [ ] Componentes de UI adaptados

### API
- [ ] Endpoints de auth (NextAuth)
- [ ] CRUD de appointments
- [ ] CRUD de services
- [ ] CRUD de clients (admin)
- [ ] Stats endpoint (admin)
- [ ] Middleware de protección

### Estilos
- [ ] Colores de Wix extraídos y aplicados
- [ ] Tipografía configurada
- [ ] Imágenes migradas
- [ ] Responsive verificado

### Testing
- [ ] Flujos críticos testeados
- [ ] Tests E2E básicos funcionando
- [ ] Performance optimizado

### Deploy
- [ ] Variables de entorno configuradas
- [ ] Database en producción creada
- [ ] Migraciones ejecutadas en prod
- [ ] Deploy exitoso
- [ ] Dominio configurado

---

## ⚠️ Problemas Comunes

### Error: "Module not found: Can't resolve '@prisma/client'"

**Solución:**
```bash
npx prisma generate
```

### Error: "NEXTAUTH_SECRET missing"

**Solución:**
```bash
# Generar secret
openssl rand -base64 32

# Agregar a .env.local
NEXTAUTH_SECRET="<secret-generado>"
```

### Error: "Database connection failed"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Verificar DATABASE_URL en .env.local
```

---

## 🎯 Timeline Estimado

| Fase | Duración | Acumulado |
|------|----------|-----------|
| 1. Setup | 1-2 días | 2 días |
| 2. Migración de datos | 1 día | 3 días |
| 3. Componentes UI | 3-5 días | 8 días |
| 4. API/Backend | 2-3 días | 11 días |
| 5. Páginas protegidas | 2 días | 13 días |
| 6. Estilos Wix | 1-2 días | 15 días |
| 7. Testing/QA | 2-3 días | 18 días |
| 8. Deploy | 1 día | 19 días |

**Total:** ~3-4 semanas (1 desarrollador) o ~2 semanas (2-3 desarrolladores en paralelo)

---

## 🆘 Soporte

Si encuentras problemas durante la migración, revisa:

1. **ARCHITECTURE.md** - Documentación técnica completa
2. **README.md** - Setup y comandos
3. GitHub Issues del proyecto

---

**¡Éxito con la migración! 🚀**
