# BarberPro - Arquitectura Técnica Completa
## Sistema de Gestión de Barbería - Producción Ready

**Stack:** Next.js 15 (App Router) + TypeScript + PostgreSQL + Prisma + NextAuth + Tailwind + shadcn/ui

**Autor:** Arquitectura diseñada para producción 2026

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura y Decisiones Técnicas](#1-arquitectura-y-decisiones-técnicas)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Modelo de Datos (Prisma Schema)](#3-modelo-de-datos-prisma-schema)
4. [API - Endpoints y Contratos](#4-api---endpoints-y-contratos)
5. [Pantallas y Rutas](#5-pantallas-y-rutas)
6. [Componentes UI](#6-componentes-ui)
7. [Lógica de Disponibilidad de Slots](#7-lógica-de-disponibilidad-de-slots)
8. [Seed y Datos de Ejemplo](#8-seed-y-datos-de-ejemplo)
9. [Guía de Instalación y Ejecución](#9-guía-de-instalación-y-ejecución)
10. [Checklist de Producción](#10-checklist-de-producción)
11. [Supuestos y Configuración](#11-supuestos-y-configuración)

---

## 1. ARQUITECTURA Y DECISIONES TÉCNICAS

### 1.1 Arquitectura Elegida: Next.js Full-Stack Monolito

**Decisión:** Implementar todo el sistema como una aplicación Next.js monolítica con App Router.

**Razones:**

1. **Simplicidad de Deploy:** Un solo servicio, menos complejidad operacional
2. **Performance:** Server Components reducen bundle size, RSC streaming mejora UX
3. **Developer Experience:** Hot reload unificado, código compartido, tipado end-to-end
4. **Costo:** Menos infraestructura vs backend separado
5. **Escalabilidad Suficiente:** Para una barbería (< 10K usuarios concurrentes), Next.js escala perfectamente
6. **SEO Built-in:** Páginas públicas con SSR/SSG out of the box

**Tradeoffs:**

- ❌ Menos flexibilidad para escalar backend independientemente
- ✅ Pero: Podemos migrar a microservicios si escalamos (refactor gradual usando Next.js Route Handlers)
- ❌ Vendor lock-in a Vercel/Node.js
- ✅ Pero: Docker permite deploy en cualquier plataforma

### 1.2 Capas de la Aplicación

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                   │
│  Next.js App Router (RSC + Client Components)│
│  └─ Public Site (SSG/SSR)                   │
│  └─ Auth Pages (SSR)                        │
│  └─ Client Dashboard (RSC + Client)         │
│  └─ Admin Panel (RSC + Client)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           API LAYER                          │
│      Next.js Route Handlers                  │
│  └─ /api/auth/* (NextAuth)                  │
│  └─ /api/appointments/*                     │
│  └─ /api/services/*                         │
│  └─ /api/admin/*                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         APPLICATION LAYER                    │
│       Services (Business Logic)              │
│  └─ AppointmentService                      │
│  └─ AvailabilityService                     │
│  └─ ClientService                           │
│  └─ RecordService                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         DATA ACCESS LAYER                    │
│    Repositories (Prisma Abstraction)         │
│  └─ AppointmentRepository                   │
│  └─ UserRepository                          │
│  └─ ServiceRepository                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          DATABASE LAYER                      │
│          PostgreSQL + Prisma ORM             │
└─────────────────────────────────────────────┘
```

### 1.3 Patrones Arquitectónicos

- **Repository Pattern:** Abstrae Prisma, facilita testing y futuras migraciones
- **Service Layer:** Lógica de negocio centralizada, reutilizable
- **DTO Pattern:** Validación con Zod en entrada/salida de APIs
- **RBAC:** Middleware de Next.js para control de acceso por rol
- **Optimistic Updates:** TanStack Query para UX responsiva

### 1.4 Seguridad

- **Autenticación:** NextAuth con Credentials Provider (bcrypt) + opcional OAuth Google
- **Autorización:** Middleware + Server Actions con verificación de rol
- **Rate Limiting:** @upstash/ratelimit en endpoints críticos (login, booking)
- **CSRF:** Next.js automático con Server Actions
- **Validación:** Zod en todos los endpoints (input sanitization)
- **SQL Injection:** Prevención automática por Prisma (prepared statements)
- **Password Hashing:** bcrypt con cost factor 12

---

## 2. ESTRUCTURA DE CARPETAS

```
barberpro/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # Grupo de rutas públicas (sin auth)
│   │   │   ├── layout.tsx            # Layout público (navbar, footer)
│   │   │   ├── page.tsx              # Home page (SSG)
│   │   │   ├── servicios/
│   │   │   │   └── page.tsx          # Página de servicios
│   │   │   ├── galeria/
│   │   │   │   └── page.tsx          # Galería de trabajos
│   │   │   ├── barberos/
│   │   │   │   └── page.tsx          # Staff / Barberos
│   │   │   ├── contacto/
│   │   │   │   └── page.tsx          # Contacto y ubicación
│   │   │   └── reservar/
│   │   │       └── page.tsx          # Wizard de reserva (redirect a login si no autenticado)
│   │   │
│   │   ├── (auth)/                   # Rutas de autenticación
│   │   │   ├── layout.tsx            # Layout minimalista auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── registro/
│   │   │       └── page.tsx          # Registro de clientes
│   │   │
│   │   ├── (dashboard)/              # Rutas protegidas (requieren auth)
│   │   │   ├── layout.tsx            # Layout con sidebar/navbar auth
│   │   │   ├── middleware.ts         # Redirect si no autenticado
│   │   │   ├── mi-cuenta/
│   │   │   │   ├── page.tsx          # Dashboard del cliente
│   │   │   │   ├── perfil/
│   │   │   │   │   └── page.tsx      # Editar perfil
│   │   │   │   ├── reservas/
│   │   │   │   │   └── page.tsx      # Mis reservas (upcoming + past)
│   │   │   │   ├── historial/
│   │   │   │   │   └── page.tsx      # Historial de cortes
│   │   │   │   └── nueva-reserva/
│   │   │   │       └── page.tsx      # Wizard de reserva
│   │   │   │
│   │   │   └── admin/                # Panel de administración
│   │   │       ├── layout.tsx        # Layout admin (sidebar con navegación)
│   │   │       ├── page.tsx          # Dashboard admin (métricas)
│   │   │       ├── clientes/
│   │   │       │   ├── page.tsx      # Lista de clientes
│   │   │       │   ├── [id]/
│   │   │       │   │   └── page.tsx  # Detalle cliente + historial
│   │   │       │   └── nuevo/
│   │   │       │       └── page.tsx  # Crear cliente
│   │   │       ├── turnos/
│   │   │       │   ├── page.tsx      # Calendario de turnos
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx  # Editar/gestionar turno
│   │   │       ├── servicios/
│   │   │       │   └── page.tsx      # CRUD servicios
│   │   │       ├── barberos/
│   │   │       │   └── page.tsx      # CRUD staff
│   │   │       ├── horarios/
│   │   │       │   └── page.tsx      # Configurar horarios y cierres
│   │   │       └── registros/
│   │   │           └── page.tsx      # Historial global de servicios
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth config
│   │   │   ├── appointments/
│   │   │   │   ├── route.ts          # GET /api/appointments, POST
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts      # GET, PATCH, DELETE /api/appointments/:id
│   │   │   │   └── available-slots/
│   │   │   │       └── route.ts      # POST /api/appointments/available-slots
│   │   │   ├── services/
│   │   │   │   ├── route.ts          # GET, POST /api/services
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH, DELETE
│   │   │   ├── staff/
│   │   │   │   ├── route.ts          # GET, POST /api/staff
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH, DELETE
│   │   │   ├── clients/
│   │   │   │   ├── route.ts          # GET, POST /api/clients (admin only)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │   │       └── records/
│   │   │   │           └── route.ts  # POST /api/clients/:id/records
│   │   │   ├── records/
│   │   │   │   └── route.ts          # GET /api/records (admin), POST
│   │   │   └── admin/
│   │   │       └── stats/
│   │   │           └── route.ts      # GET /api/admin/stats
│   │   │
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   └── globals.css               # Tailwind imports
│   │
│   ├── components/                   # Componentes React
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── toast.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── public-navbar.tsx
│   │   │   ├── dashboard-navbar.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── appointments/             # Appointment-related components
│   │   │   ├── appointment-card.tsx
│   │   │   ├── booking-wizard.tsx
│   │   │   ├── calendar-view.tsx
│   │   │   └── slot-picker.tsx
│   │   ├── services/
│   │   │   ├── service-card.tsx
│   │   │   └── service-list.tsx
│   │   ├── clients/
│   │   │   ├── client-search.tsx
│   │   │   ├── client-form.tsx
│   │   │   └── client-table.tsx
│   │   ├── records/
│   │   │   ├── record-card.tsx
│   │   │   ├── record-form.tsx
│   │   │   └── photo-upload.tsx
│   │   ├── admin/
│   │   │   ├── stats-dashboard.tsx
│   │   │   ├── metrics-card.tsx
│   │   │   └── audit-log-table.tsx
│   │   └── providers/
│   │       ├── query-provider.tsx    # TanStack Query
│   │       └── auth-provider.tsx     # NextAuth SessionProvider
│   │
│   ├── lib/                          # Utilidades y configuración
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── utils.ts                  # Helpers (cn, formatters)
│   │   ├── rate-limit.ts             # Rate limiting config
│   │   └── validations/              # Zod schemas
│   │       ├── appointment.ts
│   │       ├── service.ts
│   │       ├── user.ts
│   │       └── record.ts
│   │
│   ├── server/                       # Backend logic (Server-side only)
│   │   ├── services/                 # Business logic
│   │   │   ├── appointment.service.ts
│   │   │   ├── availability.service.ts
│   │   │   ├── client.service.ts
│   │   │   ├── service.service.ts
│   │   │   ├── staff.service.ts
│   │   │   └── record.service.ts
│   │   ├── repositories/             # Data access layer
│   │   │   ├── appointment.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── service.repository.ts
│   │   │   ├── record.repository.ts
│   │   │   └── business-hours.repository.ts
│   │   └── middleware/               # Middleware utilities
│   │       ├── auth.middleware.ts    # Auth helpers
│   │       └── rbac.middleware.ts    # Role-based access control
│   │
│   ├── db/                           # Database
│   │   ├── schema.prisma             # Prisma schema
│   │   ├── seed.ts                   # Database seeding
│   │   └── migrations/               # Prisma migrations
│   │
│   ├── types/                        # TypeScript types
│   │   ├── index.ts                  # Shared types
│   │   ├── api.ts                    # API request/response types
│   │   └── auth.ts                   # Auth-related types
│   │
│   └── hooks/                        # React hooks
│       ├── use-appointments.ts       # TanStack Query hooks
│       ├── use-services.ts
│       └── use-auth.ts
│
├── tests/                            # Tests
│   ├── e2e/                          # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── booking.spec.ts
│   │   └── admin.spec.ts
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── setup.ts
│
├── public/                           # Static assets
│   ├── images/
│   └── favicon.ico
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Descripción de Carpetas Clave

- **`app/(public)/`**: Páginas accesibles sin autenticación (Home, Servicios, Galería, Contacto)
- **`app/(auth)/`**: Páginas de login y registro
- **`app/(dashboard)/`**: Área protegida para clientes autenticados
- **`app/(dashboard)/admin/`**: Panel administrativo (solo ADMIN y STAFF)
- **`app/api/`**: API endpoints (Next.js Route Handlers)
- **`server/services/`**: Lógica de negocio pura (testable, reutilizable)
- **`server/repositories/`**: Abstracción de Prisma (facilita testing con mocks)
- **`lib/validations/`**: Schemas Zod para validación de datos
- **`components/ui/`**: Componentes de shadcn/ui (instalados con CLI)
- **`hooks/`**: Custom hooks con TanStack Query

---

## 3. MODELO DE DATOS (PRISMA SCHEMA)

```prisma
// src/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

enum Role {
  CLIENT  // Cliente regular
  STAFF   // Barbero/empleado
  ADMIN   // Administrador
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String    // bcrypt hash
  role          Role      @default(CLIENT)

  name          String
  phone         String?
  birthDate     DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relaciones
  clientProfile   ClientProfile?
  staffProfile    StaffProfile?
  appointments    Appointment[]   @relation("ClientAppointments")
  staffAppointments Appointment[] @relation("StaffAppointments")
  records         HaircutRecord[] @relation("ClientRecords")
  staffRecords    HaircutRecord[] @relation("StaffRecords")
  auditLogs       AuditLog[]

  @@index([email])
  @@map("users")
}

// Perfil extendido para clientes
model ClientProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  internalNotes   String?  // Solo visible para admin/staff
  tags            String[] // Ej: ["VIP", "frequent"]
  preferredStaffId String? // Barbero preferido

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("client_profiles")
}

// Perfil extendido para staff/barberos
model StaffProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  bio           String?
  photoUrl      String?
  specialties   String[]  // Ej: ["fade", "barba", "diseño"]
  isActive      Boolean   @default(true)

  // Servicios que puede realizar (many-to-many)
  services      Service[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("staff_profiles")
}

// ============================================
// SERVICIOS
// ============================================

model Service {
  id          String   @id @default(cuid())
  name        String   @unique // Ej: "Corte Clásico", "Fade", "Barba"
  description String?
  duration    Int      // Duración en minutos
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  staff           StaffProfile[]
  appointments    Appointment[]
  records         HaircutRecord[]

  @@map("services")
}

// ============================================
// RESERVAS / TURNOS
// ============================================

enum AppointmentStatus {
  PENDING    // Pendiente de confirmación
  CONFIRMED  // Confirmado
  COMPLETED  // Atendido
  CANCELLED  // Cancelado
  NO_SHOW    // Cliente no se presentó
}

model Appointment {
  id            String            @id @default(cuid())

  // Fecha y hora
  startTime     DateTime
  endTime       DateTime

  // Relaciones
  clientId      String
  client        User              @relation("ClientAppointments", fields: [clientId], references: [id])

  serviceId     String
  service       Service           @relation(fields: [serviceId], references: [id])

  staffId       String?           // Opcional: cliente puede no elegir barbero
  staff         User?             @relation("StaffAppointments", fields: [staffId], references: [id])

  // Estado
  status        AppointmentStatus @default(PENDING)

  // Notas
  clientNotes   String?           // Notas del cliente
  staffNotes    String?           // Notas del staff (solo admin/staff ven)

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([clientId])
  @@index([staffId])
  @@index([startTime])
  @@index([status])
  @@map("appointments")
}

// ============================================
// HISTORIAL DE CORTES
// ============================================

model HaircutRecord {
  id          String   @id @default(cuid())

  // Relaciones
  clientId    String
  client      User     @relation("ClientRecords", fields: [clientId], references: [id])

  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])

  staffId     String?
  staff       User?    @relation("StaffRecords", fields: [staffId], references: [id])

  // Detalles del servicio realizado
  date        DateTime
  price       Decimal  @db.Decimal(10, 2) // Precio en ese momento (puede diferir del servicio)
  notes       String?  // Notas del barbero
  tags        String[] // Ej: ["fade alto", "diseño estrella"]
  photoUrls   String[] // URLs de fotos del resultado

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clientId])
  @@index([staffId])
  @@index([date])
  @@map("haircut_records")
}

// ============================================
// CONFIGURACIÓN DE HORARIOS Y CIERRES
// ============================================

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// Horarios de atención por día de la semana
model BusinessHours {
  id          String    @id @default(cuid())
  dayOfWeek   DayOfWeek @unique
  isOpen      Boolean   @default(true)
  openTime    String    // Formato "HH:mm" (ej: "09:00")
  closeTime   String    // Formato "HH:mm" (ej: "18:00")

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("business_hours")
}

// Cierres excepcionales (feriados, vacaciones, etc.)
model Closure {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  reason      String?  // Ej: "Feriado Nacional", "Vacaciones"
  isAllDay    Boolean  @default(true)
  startTime   String?  // Solo si isAllDay = false
  endTime     String?  // Solo si isAllDay = false

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
  @@map("closures")
}

// ============================================
// AUDITORÍA
// ============================================

model AuditLog {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  action      String   // Ej: "CREATE_APPOINTMENT", "UPDATE_CLIENT", "CANCEL_APPOINTMENT"
  entity      String   // Ej: "Appointment", "User", "Service"
  entityId    String

  before      Json?    // Estado anterior (JSON)
  after       Json?    // Estado nuevo (JSON)

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([entity, entityId])
  @@map("audit_logs")
}

// ============================================
// CONFIGURACIÓN GLOBAL (OPCIONAL)
// ============================================

model AppConfig {
  id                String   @id @default(cuid())
  key               String   @unique // Ej: "buffer_time_minutes", "max_advance_booking_days"
  value             String   // Valor en string, parsear según tipo
  type              String   // "number", "string", "boolean"
  description       String?

  updatedAt         DateTime @updatedAt

  @@map("app_config")
}
```

### Relaciones Clave

- **User ↔ ClientProfile / StaffProfile:** One-to-one
- **User → Appointments:** One-to-many (como cliente y como staff)
- **Service ↔ StaffProfile:** Many-to-many (un staff puede hacer varios servicios, un servicio puede ser hecho por varios staff)
- **Appointment → User (client), Service, User (staff):** Many-to-one
- **HaircutRecord → User (client), Service, User (staff):** Many-to-one

---

## 4. API - ENDPOINTS Y CONTRATOS

### 4.1 Autenticación

**NextAuth Config:**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/user";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
```

### 4.2 Endpoints de Appointments

#### `GET /api/appointments`

**Auth:** Requerida

**Query Params:**
- `status?: AppointmentStatus` - Filtrar por estado
- `from?: ISO8601` - Fecha inicio (range)
- `to?: ISO8601` - Fecha fin (range)
- `page?: number` - Paginación (default: 1)
- `limit?: number` - Items por página (default: 20)

**Behavior:**
- **CLIENT:** Solo ve sus propias reservas
- **ADMIN/STAFF:** Ve todas las reservas

**Response 200:**
```json
{
  "appointments": [
    {
      "id": "clx123...",
      "startTime": "2026-01-15T10:00:00Z",
      "endTime": "2026-01-15T10:30:00Z",
      "status": "CONFIRMED",
      "client": {
        "id": "usr_123",
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "+595981123456"
      },
      "service": {
        "id": "svc_123",
        "name": "Corte Clásico",
        "duration": 30,
        "price": 80000
      },
      "staff": {
        "id": "usr_staff_1",
        "name": "Carlos Rodriguez",
        "photoUrl": "/staff/carlos.jpg"
      },
      "clientNotes": "Sin flequillo",
      "staffNotes": "Cliente regular, prefiere maquina #2"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### `POST /api/appointments`

**Auth:** Requerida (CLIENT o superior)

**Request Body:**
```json
{
  "serviceId": "svc_123",
  "staffId": "usr_staff_1", // Opcional
  "startTime": "2026-01-15T10:00:00Z",
  "clientNotes": "Sin flequillo"
}
```

**Validations:**
- `startTime` debe ser futuro
- `startTime` debe estar dentro de horarios de atención
- No debe solaparse con otro turno del mismo staff
- No debe estar en un cierre (feriado)
- Cliente no debe tener otro turno en horario solapado

**Response 201:**
```json
{
  "id": "clx123...",
  "startTime": "2026-01-15T10:00:00Z",
  "endTime": "2026-01-15T10:30:00Z",
  "status": "PENDING",
  "message": "Reserva creada exitosamente. Confirmaremos pronto."
}
```

**Errors:**
- `400`: Validación fallida (detalles en `errors` array)
- `409`: Slot no disponible (solapamiento)

#### `PATCH /api/appointments/[id]`

**Auth:** Requerida
- **CLIENT:** Solo puede actualizar sus propias reservas (solo `clientNotes` y cancelar)
- **ADMIN/STAFF:** Puede actualizar todo

**Request Body (CLIENT):**
```json
{
  "clientNotes": "Nuevo texto",
  "status": "CANCELLED" // Solo puede cancelar
}
```

**Request Body (ADMIN/STAFF):**
```json
{
  "status": "CONFIRMED", // Puede cambiar a cualquier estado
  "staffNotes": "Cliente llegó 10 min tarde",
  "staffId": "usr_staff_2" // Reasignar barbero
}
```

**Response 200:**
```json
{
  "id": "clx123...",
  "status": "CONFIRMED",
  "message": "Turno actualizado"
}
```

#### `DELETE /api/appointments/[id]`

**Auth:** ADMIN/STAFF only

**Response 204:** No content

---

#### `POST /api/appointments/available-slots`

**Auth:** Opcional (público o autenticado)

**Request Body:**
```json
{
  "serviceId": "svc_123",
  "staffId": "usr_staff_1", // Opcional
  "date": "2026-01-15" // YYYY-MM-DD
}
```

**Response 200:**
```json
{
  "slots": [
    {
      "start": "2026-01-15T09:00:00Z",
      "end": "2026-01-15T09:30:00Z",
      "available": true
    },
    {
      "start": "2026-01-15T09:30:00Z",
      "end": "2026-01-15T10:00:00Z",
      "available": false
    },
    {
      "start": "2026-01-15T10:00:00Z",
      "end": "2026-01-15T10:30:00Z",
      "available": true
    }
  ]
}
```

---

### 4.3 Endpoints de Services

#### `GET /api/services`

**Auth:** Opcional (público)

**Query Params:**
- `active?: boolean` - Solo servicios activos (default: true)

**Response 200:**
```json
{
  "services": [
    {
      "id": "svc_123",
      "name": "Corte Clásico",
      "description": "Corte tradicional con tijera y máquina",
      "duration": 30,
      "price": 80000,
      "isActive": true
    },
    {
      "id": "svc_456",
      "name": "Fade + Barba",
      "description": "Degradado completo + arreglo de barba",
      "duration": 45,
      "price": 120000,
      "isActive": true
    }
  ]
}
```

#### `POST /api/services`

**Auth:** ADMIN only

**Request Body:**
```json
{
  "name": "Corte Niños",
  "description": "Corte para menores de 12 años",
  "duration": 20,
  "price": 50000
}
```

**Response 201:**
```json
{
  "id": "svc_789",
  "name": "Corte Niños",
  "duration": 20,
  "price": 50000
}
```

#### `PATCH /api/services/[id]`

**Auth:** ADMIN only

**Request Body:** (partial update)
```json
{
  "price": 60000,
  "isActive": false
}
```

---

### 4.4 Endpoints de Staff

#### `GET /api/staff`

**Auth:** Opcional (público)

**Response 200:**
```json
{
  "staff": [
    {
      "id": "usr_staff_1",
      "name": "Carlos Rodriguez",
      "photoUrl": "/staff/carlos.jpg",
      "bio": "10 años de experiencia en cortes clásicos y modernos",
      "specialties": ["fade", "barba", "diseño"],
      "isActive": true,
      "services": [
        { "id": "svc_123", "name": "Corte Clásico" },
        { "id": "svc_456", "name": "Fade + Barba" }
      ]
    }
  ]
}
```

#### `POST /api/staff`

**Auth:** ADMIN only

**Request Body:**
```json
{
  "email": "nuevo@barber.com",
  "password": "SecurePass123!",
  "name": "Pedro Martínez",
  "bio": "Especialista en fades",
  "specialties": ["fade", "diseño"],
  "serviceIds": ["svc_123", "svc_456"]
}
```

**Response 201:**
```json
{
  "id": "usr_staff_2",
  "name": "Pedro Martínez",
  "message": "Staff creado exitosamente"
}
```

---

### 4.5 Endpoints de Clients (Admin)

#### `GET /api/clients`

**Auth:** ADMIN/STAFF only

**Query Params:**
- `search?: string` - Buscar por nombre, email, teléfono
- `page?: number`
- `limit?: number`

**Response 200:**
```json
{
  "clients": [
    {
      "id": "usr_client_1",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+595981123456",
      "birthDate": "1990-05-15",
      "createdAt": "2025-01-01T00:00:00Z",
      "clientProfile": {
        "internalNotes": "Cliente VIP, siempre puntual",
        "tags": ["VIP", "frequent"]
      }
    }
  ],
  "pagination": {...}
}
```

#### `GET /api/clients/[id]`

**Auth:** ADMIN/STAFF only (o el propio cliente)

**Response 200:**
```json
{
  "id": "usr_client_1",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+595981123456",
  "birthDate": "1990-05-15",
  "clientProfile": {
    "internalNotes": "Cliente VIP",
    "tags": ["VIP"]
  },
  "appointments": [
    {
      "id": "apt_123",
      "startTime": "2026-01-20T10:00:00Z",
      "status": "CONFIRMED",
      "service": { "name": "Corte Clásico" }
    }
  ],
  "records": [
    {
      "id": "rec_123",
      "date": "2025-12-15",
      "service": { "name": "Fade + Barba" },
      "staff": { "name": "Carlos Rodriguez" },
      "price": 120000,
      "photoUrls": ["/uploads/rec_123_1.jpg"]
    }
  ]
}
```

#### `POST /api/clients/[id]/records`

**Auth:** ADMIN/STAFF only

**Request Body:**
```json
{
  "serviceId": "svc_123",
  "staffId": "usr_staff_1",
  "date": "2026-01-07T14:00:00Z",
  "price": 80000,
  "notes": "Corte #2 en los lados, tijera arriba",
  "tags": ["fade medio", "clásico"],
  "photoUrls": ["/uploads/photo1.jpg"]
}
```

**Response 201:**
```json
{
  "id": "rec_789",
  "message": "Registro creado exitosamente"
}
```

---

### 4.6 Endpoints de Records

#### `GET /api/records`

**Auth:** Requerida
- **CLIENT:** Solo ve sus propios registros
- **ADMIN/STAFF:** Ve todos

**Query Params:**
- `clientId?: string` (ADMIN/STAFF only)
- `from?: ISO8601`
- `to?: ISO8601`
- `page?: number`
- `limit?: number`

**Response 200:**
```json
{
  "records": [
    {
      "id": "rec_123",
      "client": {
        "id": "usr_client_1",
        "name": "Juan Pérez"
      },
      "service": {
        "id": "svc_123",
        "name": "Corte Clásico"
      },
      "staff": {
        "id": "usr_staff_1",
        "name": "Carlos Rodriguez"
      },
      "date": "2025-12-15T14:00:00Z",
      "price": 80000,
      "notes": "Cliente satisfecho con el resultado",
      "tags": ["fade medio"],
      "photoUrls": ["/uploads/rec_123_1.jpg", "/uploads/rec_123_2.jpg"]
    }
  ],
  "pagination": {...}
}
```

---

### 4.7 Endpoints de Admin Stats

#### `GET /api/admin/stats`

**Auth:** ADMIN only

**Query Params:**
- `from?: ISO8601` (default: 30 días atrás)
- `to?: ISO8601` (default: hoy)

**Response 200:**
```json
{
  "overview": {
    "totalAppointments": 145,
    "totalRevenue": 11600000, // Guaraníes
    "totalClients": 87,
    "avgAppointmentsPerDay": 4.8
  },
  "appointmentsByStatus": {
    "PENDING": 12,
    "CONFIRMED": 25,
    "COMPLETED": 98,
    "CANCELLED": 7,
    "NO_SHOW": 3
  },
  "topServices": [
    {
      "serviceId": "svc_123",
      "serviceName": "Corte Clásico",
      "count": 65,
      "revenue": 5200000
    },
    {
      "serviceId": "svc_456",
      "serviceName": "Fade + Barba",
      "count": 45,
      "revenue": 5400000
    }
  ],
  "topStaff": [
    {
      "staffId": "usr_staff_1",
      "staffName": "Carlos Rodriguez",
      "appointmentsCompleted": 58
    }
  ],
  "frequentClients": [
    {
      "clientId": "usr_client_1",
      "clientName": "Juan Pérez",
      "appointmentsCount": 12
    }
  ]
}
```

---

## 5. PANTALLAS Y RUTAS

### 5.1 Sitio Público (No Autenticado)

#### **Home (`/`)**
- **Layout:** Navbar (Logo, Servicios, Galería, Barberos, Contacto, Login/Registro)
- **Contenido:**
  - Hero section con CTA "Reservar Turno" → redirect a `/reservar`
  - Sección "Nuestros Servicios" (cards con servicios destacados)
  - Sección "Nuestro Equipo" (fotos y bio de barberos)
  - Sección "Galería" (grid de fotos de trabajos)
  - Sección "Ubicación" (mapa + dirección)
  - Footer con horarios, redes sociales, contacto

#### **Servicios (`/servicios`)**
- Lista completa de servicios con:
  - Nombre, descripción, duración, precio
  - CTA "Reservar" → redirect a `/reservar?service={id}`

#### **Galería (`/galeria`)**
- Grid de fotos de trabajos realizados (filtrable por tag/barbero)
- Lightbox para ver fotos en detalle

#### **Barberos (`/barberos`)**
- Cards con foto, nombre, bio, especialidades
- Botón "Reservar con {nombre}" → `/reservar?staff={id}`

#### **Contacto (`/contacto`)**
- Formulario de contacto (envía email o guarda en DB)
- Mapa de ubicación (Google Maps embed)
- Info: teléfono, email, horarios

#### **Reservar (`/reservar`)**
- **Si no autenticado:** Redirect a `/login?callbackUrl=/reservar`
- **Si autenticado:** Ver sección Dashboard

---

### 5.2 Autenticación

#### **Login (`/login`)**
- Form: email + password
- Botón "Iniciar sesión con Google" (opcional)
- Link: "¿No tienes cuenta? Regístrate"
- NextAuth maneja autenticación
- **Redirect:** `/mi-cuenta` (client) o `/admin` (admin)

#### **Registro (`/registro`)**
- Form: nombre, email, teléfono, contraseña, confirmar contraseña
- Validación: email único, password fuerte (min 8 chars, uppercase, number)
- Crea cuenta con rol CLIENT
- Auto-login después de registro
- **Redirect:** `/mi-cuenta`

---

### 5.3 Dashboard Cliente (Autenticado)

#### **Mi Cuenta - Dashboard (`/mi-cuenta`)**
- **Layout:** Sidebar con navegación (Inicio, Reservas, Historial, Perfil, Logout)
- **Contenido:**
  - Bienvenida con nombre del cliente
  - Próxima reserva (card con detalles + botón "Cancelar" si es > 24hs antes)
  - Resumen: total de cortes, último corte
  - CTA "Nueva Reserva"

#### **Mis Reservas (`/mi-cuenta/reservas`)**
- Tabs: "Próximas" / "Pasadas"
- **Próximas:**
  - Lista de reservas PENDING y CONFIRMED
  - Cada card: fecha, hora, servicio, barbero, estado
  - Acciones: "Cancelar" (solo si > 24hs antes), "Reprogramar"
- **Pasadas:**
  - Lista de COMPLETED, CANCELLED, NO_SHOW
  - Sin acciones

#### **Nueva Reserva (`/mi-cuenta/nueva-reserva`)**
- **Wizard multi-step:**
  1. **Elegir Servicio:** Grid de cards con servicios
  2. **Elegir Barbero:** (Opcional) Grid de barberos o "Sin preferencia"
  3. **Elegir Fecha y Hora:**
     - Calendar component (react-day-picker o shadcn calendar)
     - Al seleccionar fecha → fetch `/api/appointments/available-slots`
     - Grid de slots disponibles (cada 30 min)
  4. **Confirmar:** Resumen + campo "Notas opcionales"
  - **Submit:** POST `/api/appointments`
  - **Redirect:** `/mi-cuenta/reservas` con toast "Reserva creada"

#### **Historial (`/mi-cuenta/historial`)**
- Timeline o cards de registros de cortes
- Cada card:
  - Fecha, servicio, barbero, precio
  - Fotos (gallery/carousel)
  - Tags (badges)
  - Notas (solo las que staff haya marcado como "visibles para cliente")

#### **Perfil (`/mi-cuenta/perfil`)**
- Form para editar: nombre, teléfono, email, fecha de nacimiento
- Cambiar contraseña (form separado)
- **Submit:** PATCH `/api/clients/[userId]`

---

### 5.4 Panel Admin (ADMIN/STAFF)

#### **Admin Dashboard (`/admin`)**
- **Layout:** Sidebar con navegación (Dashboard, Turnos, Clientes, Servicios, Barberos, Horarios, Registros)
- **Contenido:**
  - Métricas en cards:
    - Turnos hoy (count + lista rápida)
    - Ingresos del mes
    - Clientes nuevos este mes
    - Tasa de cancelación
  - Gráfico: Turnos por día (últimos 30 días) - usar Recharts
  - Tabla: Próximos turnos (10 siguientes)

#### **Turnos (`/admin/turnos`)**
- **Vista Calendario:** Semanal/mensual (usar @fullcalendar o custom)
- Eventos: cada appointment en su slot
- Click en evento → modal con detalles + acciones:
  - Confirmar, Cancelar, Marcar como No Show, Editar (cambiar barbero/hora)
- Botón "Nuevo Turno" → modal con wizard similar al cliente

#### **Detalle Turno (`/admin/turnos/[id]`)**
- Detalles completos del turno
- Form para editar: status, staff, staffNotes
- Botón "Completar y crear registro" → auto-crea HaircutRecord y marca COMPLETED

#### **Clientes (`/admin/clientes`)**
- Tabla con:
  - Nombre, email, teléfono, fecha registro, tags
  - Acciones: Ver, Editar, Ver Historial
- Search bar (buscar por nombre/email)
- Paginación server-side
- Botón "Nuevo Cliente" → modal/página con form

#### **Detalle Cliente (`/admin/clientes/[id]`)**
- Info del cliente
- **Tabs:**
  - **Información:** Form editable (nombre, teléfono, internal notes, tags)
  - **Historial:** Lista de registros de cortes con fotos
  - **Reservas:** Todas las reservas del cliente

#### **Servicios (`/admin/servicios`)**
- Tabla: nombre, duración, precio, activo
- Acciones: Editar (inline o modal), Activar/Desactivar
- Botón "Nuevo Servicio"

#### **Barberos (`/admin/barberos`)**
- Cards o tabla: foto, nombre, bio, especialidades, servicios que realiza
- Acciones: Editar, Activar/Desactivar
- Botón "Nuevo Barbero" → crea User con rol STAFF + StaffProfile

#### **Horarios (`/admin/horarios`)**
- **Tab 1: Horarios Semanales**
  - Form con días de la semana:
    - Checkbox "Abierto"
    - Inputs: hora inicio, hora fin
  - Submit: upsert BusinessHours
- **Tab 2: Cierres Excepcionales**
  - Lista de closures
  - Form: fecha, motivo, todo el día (sí/no), hora inicio/fin
  - Botón "Agregar Cierre"

#### **Registros (`/admin/registros`)**
- Tabla de todos los HaircutRecords
- Filtros: cliente, barbero, servicio, rango de fechas
- Cada fila: fecha, cliente, servicio, barbero, precio, fotos (thumbnails)
- Click → modal con detalles completos + galería de fotos
- Botón "Nuevo Registro" → form manual (por si servicio walk-in sin reserva)

---

### 5.5 Navegación (Wireflow)

```
PUBLIC
  / → /servicios → /galeria → /barberos → /contacto
  / → /reservar → (redirect si no auth) → /login → /mi-cuenta/nueva-reserva

AUTH (CLIENT)
  /mi-cuenta → /mi-cuenta/reservas → /mi-cuenta/nueva-reserva
            → /mi-cuenta/historial
            → /mi-cuenta/perfil

AUTH (ADMIN/STAFF)
  /admin → /admin/turnos → /admin/turnos/[id]
         → /admin/clientes → /admin/clientes/[id]
         → /admin/servicios
         → /admin/barberos
         → /admin/horarios
         → /admin/registros
```

---

## 6. COMPONENTES UI

### 6.1 shadcn/ui Components (Instalar con CLI)

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form select dialog table badge avatar calendar toast tabs dropdown-menu separator
```

### 6.2 Componentes Custom

#### **`ServiceCard`**
- **Props:** service (Service), variant ("public" | "admin")
- **Render:**
  - Card con icono/imagen
  - Nombre, descripción
  - Duración, precio
  - Botón "Reservar" (public) o "Editar" (admin)
- **Accesibilidad:** aria-label, keyboard nav

#### **`AppointmentCard`**
- **Props:** appointment (Appointment), role (Role)
- **Render:**
  - Fecha/hora destacada
  - Servicio, barbero, cliente (si admin)
  - Badge con status (color según estado)
  - Acciones según rol: Cancelar (client), Confirmar/Editar (admin)
- **Estados:** loading (skeleton), empty (mensaje "No tienes reservas")

#### **`BookingWizard`**
- **Props:** initialService?, initialStaff?
- **Steps:**
  1. ServiceSelector (grid de ServiceCard)
  2. StaffSelector (grid con avatares + bios)
  3. DateTimeSelector (Calendar + SlotPicker)
  4. ConfirmationStep (resumen + notes textarea)
- **State:** React Context o Zustand
- **Validación:** Zod en cada step
- **Loading:** Spinner durante POST

#### **`SlotPicker`**
- **Props:** slots (Slot[]), selectedSlot, onSelect
- **Render:**
  - Grid de botones (ej: 09:00, 09:30, 10:00...)
  - Disabled si not available
  - Highlight selected
- **Accesibilidad:** aria-selected, focus-visible

#### **`CalendarView` (Admin)**
- **Lib:** @fullcalendar/react o custom con react-big-calendar
- **Props:** appointments, onEventClick, onSlotClick
- **Render:**
  - Vista semanal/mensual
  - Eventos con color según status
  - Click en slot vacío → modal "Nuevo Turno"

#### **`ClientSearch`**
- **Props:** onSelect (callback con cliente)
- **Render:**
  - Input con debounce (300ms)
  - Fetch `/api/clients?search={query}`
  - Dropdown con resultados (avatar + nombre + email)
  - Keyboard nav (arrow keys, enter)

#### **`ClientForm`**
- **Props:** client?, onSubmit
- **Render:**
  - React Hook Form + Zod resolver
  - Fields: nombre, email, teléfono, birthDate
  - (Admin only) Internal notes, tags (input de chips)
  - Submit: POST/PATCH `/api/clients`

#### **`RecordCard`**
- **Props:** record (HaircutRecord), role
- **Render:**
  - Fecha, servicio, barbero
  - Precio (badge)
  - Galería de fotos (carousel o grid)
  - Tags (badges)
  - Notes (solo admin ve internal notes)

#### **`PhotoUpload`**
- **Props:** onUpload (callback con URLs)
- **Render:**
  - Drag & drop zone (react-dropzone)
  - Preview de imágenes
  - Upload a `/api/upload` (Next.js API route + S3/Cloudinary)
  - Progress bar

#### **`StatsDashboard` (Admin)**
- **Props:** stats (from `/api/admin/stats`)
- **Render:**
  - Grid de MetricsCard (total appointments, revenue, etc.)
  - Gráfico de barras (Recharts): turnos por día
  - Tabla: Top servicios
  - Tabla: Clientes frecuentes

#### **`MetricsCard`**
- **Props:** title, value, change (%), icon
- **Render:**
  - Card con icono (lucide-react)
  - Título, valor grande
  - Badge con cambio porcentual (verde ↑ / rojo ↓)

#### **`AuditLogTable`**
- **Props:** logs (AuditLog[])
- **Render:**
  - Table con: fecha, usuario, acción, entidad
  - Expandable row para ver before/after JSON
  - Filtros: usuario, acción, fecha range

---

### 6.3 Estados Comunes

- **Loading:** Skeleton components (shadcn/ui tiene Skeleton)
- **Empty:** EmptyState component con ilustración (lucide icon) + mensaje + CTA
- **Error:** Toast con error message (shadcn toast)

---

## 7. LÓGICA DE DISPONIBILIDAD DE SLOTS

### 7.1 Algoritmo de Cálculo

**Ubicación:** `src/server/services/availability.service.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { addMinutes, format, parse, isBefore, isAfter, isWithinInterval } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

const TIMEZONE = "America/Asuncion"; // Paraguay timezone
const SLOT_INTERVAL_MINUTES = 30;
const BUFFER_MINUTES = 10; // Buffer entre turnos (configurable en AppConfig)

interface AvailabilityInput {
  serviceId: string;
  staffId?: string;
  date: string; // YYYY-MM-DD
}

interface Slot {
  start: Date;
  end: Date;
  available: boolean;
}

export class AvailabilityService {
  /**
   * Calcula slots disponibles para un día específico
   */
  async getAvailableSlots(input: AvailabilityInput): Promise<Slot[]> {
    // 1. Obtener servicio (para duración)
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (!service) throw new Error("Service not found");

    const serviceDuration = service.duration;

    // 2. Parsear fecha en timezone local
    const dateStr = input.date;
    const dayOfWeek = format(parse(dateStr, "yyyy-MM-dd", new Date()), "EEEE").toUpperCase();

    // 3. Obtener horarios de atención para ese día
    const businessHours = await prisma.businessHours.findUnique({
      where: { dayOfWeek: dayOfWeek as any },
    });

    if (!businessHours || !businessHours.isOpen) {
      return []; // Cerrado ese día
    }

    // 4. Verificar si hay cierre excepcional
    const closure = await prisma.closure.findFirst({
      where: {
        date: new Date(dateStr),
        OR: [
          { isAllDay: true },
          // TODO: manejar cierres parciales con startTime/endTime
        ],
      },
    });

    if (closure) {
      return []; // Cerrado por feriado/vacaciones
    }

    // 5. Generar slots desde openTime hasta closeTime
    const openTime = parse(businessHours.openTime, "HH:mm", new Date(dateStr));
    const closeTime = parse(businessHours.closeTime, "HH:mm", new Date(dateStr));

    const slots: Slot[] = [];
    let current = openTime;

    while (isBefore(current, closeTime)) {
      const slotEnd = addMinutes(current, serviceDuration);

      // No permitir slots que terminen después del cierre
      if (isAfter(slotEnd, closeTime)) {
        break;
      }

      // Convertir a UTC para guardar en DB
      const slotStartUTC = zonedTimeToUtc(current, TIMEZONE);
      const slotEndUTC = zonedTimeToUtc(slotEnd, TIMEZONE);

      slots.push({
        start: slotStartUTC,
        end: slotEndUTC,
        available: true, // Default, verificaremos después
      });

      current = addMinutes(current, SLOT_INTERVAL_MINUTES);
    }

    // 6. Obtener turnos existentes para ese día y staff (o todos los staff si no especificado)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: zonedTimeToUtc(parse(dateStr, "yyyy-MM-dd", new Date()), TIMEZONE),
          lt: zonedTimeToUtc(addMinutes(parse(dateStr, "yyyy-MM-dd", new Date()), 24 * 60), TIMEZONE),
        },
        staffId: input.staffId || undefined,
        status: {
          in: ["PENDING", "CONFIRMED"], // Solo contar turnos activos
        },
      },
    });

    // 7. Marcar slots como no disponibles si hay solapamiento
    slots.forEach((slot) => {
      const hasConflict = existingAppointments.some((apt) => {
        // Considerar buffer: slot no disponible si está dentro de (apt.start - buffer) y (apt.end + buffer)
        const aptStartWithBuffer = addMinutes(apt.startTime, -BUFFER_MINUTES);
        const aptEndWithBuffer = addMinutes(apt.endTime, BUFFER_MINUTES);

        // Verificar solapamiento
        return (
          isWithinInterval(slot.start, { start: aptStartWithBuffer, end: aptEndWithBuffer }) ||
          isWithinInterval(slot.end, { start: aptStartWithBuffer, end: aptEndWithBuffer }) ||
          isWithinInterval(aptStartWithBuffer, { start: slot.start, end: slot.end })
        );
      });

      if (hasConflict) {
        slot.available = false;
      }
    });

    // 8. Filtrar slots en el pasado (no permitir reservas en slots ya pasados)
    const now = new Date();
    return slots.filter((slot) => isAfter(slot.start, now));
  }

  /**
   * Valida si un slot específico está disponible (antes de crear turno)
   */
  async validateSlot(
    serviceId: string,
    staffId: string | null,
    startTime: Date
  ): Promise<boolean> {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return false;

    const endTime = addMinutes(startTime, service.duration);

    // Verificar solapamiento
    const conflicts = await prisma.appointment.findMany({
      where: {
        staffId: staffId || undefined,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });

    return conflicts.length === 0;
  }
}
```

### 7.2 Uso en API Route

```typescript
// src/app/api/appointments/available-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AvailabilityService } from "@/server/services/availability.service";
import { availabilitySlotsSchema } from "@/lib/validations/appointment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = availabilitySlotsSchema.parse(body);

    const availabilityService = new AvailabilityService();
    const slots = await availabilityService.getAvailableSlots(validated);

    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

## 8. SEED Y DATOS DE EJEMPLO

**Archivo:** `src/db/seed.ts`

```typescript
import { PrismaClient, Role, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Crear usuarios
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const userPassword = await bcrypt.hash("User123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@barberpro.com" },
    update: {},
    create: {
      email: "admin@barberpro.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      name: "Administrador",
      phone: "+595981000001",
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: "carlos@barberpro.com" },
    update: {},
    create: {
      email: "carlos@barberpro.com",
      passwordHash: userPassword,
      role: Role.STAFF,
      name: "Carlos Rodriguez",
      phone: "+595981000002",
      staffProfile: {
        create: {
          bio: "10 años de experiencia en cortes clásicos y modernos. Especialista en fades y diseños.",
          photoUrl: "/staff/carlos.jpg",
          specialties: ["fade", "barba", "diseño"],
          isActive: true,
        },
      },
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "pedro@barberpro.com" },
    update: {},
    create: {
      email: "pedro@barberpro.com",
      passwordHash: userPassword,
      role: Role.STAFF,
      name: "Pedro Martínez",
      phone: "+595981000003",
      staffProfile: {
        create: {
          bio: "Experto en cortes clásicos y restauración de barbas.",
          photoUrl: "/staff/pedro.jpg",
          specialties: ["clásico", "barba"],
          isActive: true,
        },
      },
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: "juan@example.com" },
    update: {},
    create: {
      email: "juan@example.com",
      passwordHash: userPassword,
      role: Role.CLIENT,
      name: "Juan Pérez",
      phone: "+595981123456",
      birthDate: new Date("1990-05-15"),
      clientProfile: {
        create: {
          internalNotes: "Cliente VIP, siempre puntual",
          tags: ["VIP", "frequent"],
        },
      },
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {},
    create: {
      email: "maria@example.com",
      passwordHash: userPassword,
      role: Role.CLIENT,
      name: "María López",
      phone: "+595981654321",
    },
  });

  // 2. Crear servicios
  const servicios = [
    {
      name: "Corte Clásico",
      description: "Corte tradicional con tijera y máquina",
      duration: 30,
      price: 80000,
    },
    {
      name: "Fade Moderno",
      description: "Degradado completo con diseño",
      duration: 45,
      price: 100000,
    },
    {
      name: "Barba",
      description: "Arreglo y perfilado de barba",
      duration: 20,
      price: 50000,
    },
    {
      name: "Combo Fade + Barba",
      description: "Servicio completo de fade y barba",
      duration: 60,
      price: 140000,
    },
    {
      name: "Corte Niños",
      description: "Corte para menores de 12 años",
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
  }

  // 3. Asignar servicios a staff
  await prisma.staffProfile.update({
    where: { userId: staff1.id },
    data: {
      services: {
        connect: createdServices.map((s) => ({ id: s.id })),
      },
    },
  });

  await prisma.staffProfile.update({
    where: { userId: staff2.id },
    data: {
      services: {
        connect: createdServices.slice(0, 3).map((s) => ({ id: s.id })), // Solo primeros 3
      },
    },
  });

  // 4. Configurar horarios de atención
  const businessHoursData = [
    { dayOfWeek: "MONDAY", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: "TUESDAY", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: "WEDNESDAY", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: "THURSDAY", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: "FRIDAY", isOpen: true, openTime: "09:00", closeTime: "19:00" },
    { dayOfWeek: "SATURDAY", isOpen: true, openTime: "08:00", closeTime: "14:00" },
    { dayOfWeek: "SUNDAY", isOpen: false, openTime: "00:00", closeTime: "00:00" },
  ];

  for (const bh of businessHoursData) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: bh.dayOfWeek as any },
      update: bh,
      create: bh as any,
    });
  }

  // 5. Crear algunos turnos de ejemplo
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      serviceId: createdServices[0].id,
      staffId: staff1.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      status: AppointmentStatus.CONFIRMED,
      clientNotes: "Sin flequillo por favor",
    },
  });

  // 6. Crear registros de cortes históricos
  await prisma.haircutRecord.create({
    data: {
      clientId: client1.id,
      serviceId: createdServices[1].id,
      staffId: staff1.id,
      date: new Date("2025-12-15"),
      price: 100000,
      notes: "Fade alto, diseño de líneas laterales",
      tags: ["fade alto", "diseño"],
      photoUrls: ["/uploads/example1.jpg"],
    },
  });

  // 7. Configuración de app (buffer time)
  await prisma.appConfig.upsert({
    where: { key: "buffer_time_minutes" },
    update: {},
    create: {
      key: "buffer_time_minutes",
      value: "10",
      type: "number",
      description: "Tiempo de buffer entre turnos (en minutos)",
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Ejecutar seed:**
```bash
npx prisma db seed
```

**Configurar en `package.json`:**
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} src/db/seed.ts"
  }
}
```

---

## 9. GUÍA DE INSTALACIÓN Y EJECUCIÓN

### 9.1 Requisitos Previos

- Node.js 20+ (LTS)
- PostgreSQL 15+ (local o Docker)
- npm o pnpm

### 9.2 Variables de Entorno

**Archivo `.env.local`:**

```bash
# Database
DATABASE_URL="postgresql://barberpro:password@localhost:5432/barberpro"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro-generado-con-openssl-rand-base64-32"

# OAuth (Opcional)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Upload (si usas S3/Cloudinary)
# AWS_S3_BUCKET="barberpro-uploads"
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."

# Rate Limiting (Upstash Redis - opcional)
# UPSTASH_REDIS_REST_URL="..."
# UPSTASH_REDIS_REST_TOKEN="..."
```

### 9.3 Instalación Local

```bash
# 1. Clonar repo
git clone https://github.com/tu-repo/barberpro.git
cd barberpro

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Levantar PostgreSQL (con Docker)
docker-compose up -d postgres

# 5. Ejecutar migraciones
npx prisma migrate dev

# 6. Seed de datos
npx prisma db seed

# 7. Generar Prisma Client
npx prisma generate

# 8. Correr en desarrollo
npm run dev

# App corriendo en http://localhost:3000
```

### 9.4 Docker Compose (Desarrollo)

**`docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: barberpro-db
    environment:
      POSTGRES_USER: barberpro
      POSTGRES_PASSWORD: password
      POSTGRES_DB: barberpro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U barberpro"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: barberpro-app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://barberpro:password@postgres:5432/barberpro"
      NEXTAUTH_URL: "http://localhost:3000"
      NEXTAUTH_SECRET: "your-secret-here"
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

volumes:
  postgres_data:
```

**`docker/Dockerfile`:**

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Levantar todo:**

```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

### 9.5 Deploy a Producción

#### Opción 1: Vercel (Recomendado para Next.js)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard:
# - DATABASE_URL (usar Vercel Postgres o Supabase/Neon)
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL (tu dominio)
```

**Database:** Usar Vercel Postgres, Neon, Supabase o RDS

#### Opción 2: Railway

1. Conectar repo de GitHub
2. Agregar PostgreSQL addon
3. Configurar env vars en dashboard
4. Railway auto-detecta Next.js y hace deploy

#### Opción 3: VPS (Ubuntu + Docker)

```bash
# En el servidor
git clone https://github.com/tu-repo/barberpro.git
cd barberpro

# Crear .env.local con valores de producción
vim .env.local

# Build y levantar con Docker
docker-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Nginx reverse proxy (opcional)
# Configurar nginx para redirigir a localhost:3000
```

### 9.6 Tests

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 10. CHECKLIST DE PRODUCCIÓN

### 10.1 Seguridad

- [ ] **Variables de entorno:**
  - [ ] `NEXTAUTH_SECRET` generado con `openssl rand -base64 32`
  - [ ] `DATABASE_URL` sin credenciales hardcoded
  - [ ] Secrets en Vercel/Railway, NO en código
- [ ] **HTTPS:** Forzar HTTPS en producción (Vercel lo hace automático)
- [ ] **CORS:** Configurar dominios permitidos
- [ ] **Rate Limiting:**
  - [ ] `/api/auth/signin`: 5 intentos / 15 min
  - [ ] `/api/appointments`: 10 requests / min
  - [ ] Usar @upstash/ratelimit o alternativa
- [ ] **CSP Headers:** Configurar Content-Security-Policy en `next.config.js`
- [ ] **Input Sanitization:** Zod valida todos los inputs
- [ ] **SQL Injection:** Prisma previene automáticamente
- [ ] **XSS:** React escapa por default, validar HTML user-generated
- [ ] **Sesiones:** httpOnly cookies (NextAuth default), SameSite=Lax

### 10.2 Base de Datos

- [ ] **Backups automáticos:**
  - [ ] Daily backups (retención 30 días)
  - [ ] Point-in-time recovery habilitado (Vercel Postgres / RDS)
- [ ] **Indices:** Verificar índices en campos buscados (`email`, `startTime`, `clientId`)
- [ ] **Connection Pooling:** Usar PgBouncer o Prisma Data Proxy
- [ ] **Migraciones:** Ejecutar `prisma migrate deploy` en CI/CD

### 10.3 Performance

- [ ] **Next.js Optimizations:**
  - [ ] `output: "standalone"` en `next.config.js` (reduce image size)
  - [ ] Usar Next/Image para imágenes (lazy load, WebP)
  - [ ] Implementar ISR/SSG en páginas públicas (`revalidate: 3600`)
- [ ] **Database:**
  - [ ] Queries optimizados (select only needed fields)
  - [ ] Paginación en todas las listas
- [ ] **Caching:**
  - [ ] Redis para cache de servicios/horarios (rara vez cambian)
  - [ ] React Query staleTime para reducir refetches
- [ ] **Bundle Size:**
  - [ ] Lazy load componentes pesados (Calendar, Charts)
  - [ ] Eliminar dependencias no usadas

### 10.4 Observabilidad

- [ ] **Logging:**
  - [ ] Pino o Winston para logs estructurados
  - [ ] Log errors con context (userId, requestId)
  - [ ] Enviar logs a servicio externo (Logtail, Datadog)
- [ ] **Monitoring:**
  - [ ] Sentry para error tracking
  - [ ] Vercel Analytics o Plausible para métricas web
  - [ ] Uptime monitor (UptimeRobot, Better Uptime)
- [ ] **APM:** New Relic o Datadog para performance monitoring (opcional)

### 10.5 Testing

- [ ] **Unit Tests:** Cobertura > 70% en services/repositories
- [ ] **Integration Tests:** Endpoints críticos (auth, booking)
- [ ] **E2E Tests:**
  - [ ] Flujo de registro → login → reserva → cancelación
  - [ ] Admin: crear cliente → agregar registro → ver stats
- [ ] **Smoke Tests en CI/CD:** Ejecutar tests antes de deploy

### 10.6 CI/CD

- [ ] **GitHub Actions / GitLab CI:**
  - [ ] Lint + TypeScript check
  - [ ] Run tests
  - [ ] Build Next.js
  - [ ] Deploy automático a staging (en push a `main`)
  - [ ] Deploy a producción (manual trigger o tag)
- [ ] **Pre-commit hooks (Husky):**
  - [ ] Lint-staged: ESLint + Prettier
  - [ ] TypeScript check

### 10.7 Documentación

- [ ] **README.md:** Setup, env vars, comandos
- [ ] **API Docs:** Swagger/OpenAPI (opcional) o Postman collection
- [ ] **CHANGELOG.md:** Versionado semántico
- [ ] **Runbook:** Procedimientos para incidentes (DB restore, rollback)

### 10.8 Legal y Compliance

- [ ] **Términos y Condiciones**
- [ ] **Política de Privacidad** (GDPR si aplica)
- [ ] **Consentimiento de cookies** (si usas analytics)

### 10.9 Email / Notificaciones (Preparación)

- [ ] **Setup email provider:** Resend, SendGrid, AWS SES
- [ ] **Templates:**
  - [ ] Confirmación de reserva
  - [ ] Recordatorio 24hs antes
  - [ ] Cancelación
- [ ] **WhatsApp (opcional):** Twilio API para notificaciones

---

## 11. SUPUESTOS Y CONFIGURACIÓN

### 11.1 Supuestos Asumidos

Dado que no se especificaron todos los detalles, asumí los siguientes valores (modificables):

- **Nombre:** BarberPro
- **País/Timezone:** Paraguay (`America/Asuncion`)
- **Moneda:** Guaraníes (PYG)
- **Horarios default:**
  - Lunes a Jueves: 09:00 - 18:00
  - Viernes: 09:00 - 19:00
  - Sábado: 08:00 - 14:00
  - Domingo: Cerrado
- **Servicios default:**
  - Corte Clásico: 30 min, 80.000 Gs
  - Fade Moderno: 45 min, 100.000 Gs
  - Barba: 20 min, 50.000 Gs
  - Combo Fade + Barba: 60 min, 140.000 Gs
  - Corte Niños: 20 min, 50.000 Gs
- **Buffer entre turnos:** 10 minutos
- **Intervalo de slots:** 30 minutos
- **Reglas de cancelación:**
  - Cliente puede cancelar hasta 24hs antes
  - Admin puede cancelar en cualquier momento
- **Adelanto máximo de reserva:** 30 días

### 11.2 Modificaciones Requeridas

Para personalizar:

1. **Cambiar nombre/branding:**
   - Editar `metadata` en `src/app/layout.tsx`
   - Reemplazar logos en `/public/`
   - Actualizar colores en `tailwind.config.ts`

2. **Cambiar timezone:**
   - Modificar `TIMEZONE` en `availability.service.ts`

3. **Cambiar servicios/horarios:**
   - Editar `src/db/seed.ts`
   - Re-ejecutar seed: `npx prisma db seed`

4. **Cambiar reglas de negocio:**
   - Buffer: Modificar `BUFFER_MINUTES` en `availability.service.ts`
   - Cancelación: Editar validación en `appointment.service.ts`

---

## FIN DEL DOCUMENTO

Este documento es la **especificación técnica completa** para implementar BarberPro.

**Próximos pasos:**

1. Revisar y aprobar arquitectura
2. Configurar proyecto Next.js
3. Implementar schema de Prisma
4. Desarrollar API endpoints
5. Construir componentes UI
6. Implementar lógica de negocio
7. Testing
8. Deploy a staging
9. UAT (User Acceptance Testing)
10. Deploy a producción

**Estimación de desarrollo:** 4-6 semanas (1 dev full-time) o 2-3 semanas (equipo de 2-3 devs)

---

**Contacto para aclaraciones:** [Tu email o Slack]

**Versión:** 1.0 (2026-01-07)
