# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BarberPro** is a full-stack barbershop management application built with Next.js 15, TypeScript, PostgreSQL, and Prisma. It provides appointment booking, staff management, customer history tracking, and an admin panel for business operations.

**Current Status:** MVP Functional (85% complete)

## Tech Stack

- **Framework:** Next.js 15.1.0 (App Router)
- **Language:** TypeScript 5.3.3
- **Database:** PostgreSQL + Prisma ORM 5.9.1
- **Authentication:** NextAuth 4.24.5 (Credentials + Google OAuth)
- **UI:** Tailwind CSS 3.4.1 + shadcn/ui + Radix UI
- **State Management:** TanStack Query (React Query) 5.20.2
- **Validation:** Zod 3.25.76
- **Forms:** React Hook Form 7.70.0

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Database commands
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed initial data
npm run db:studio       # Open Prisma Studio
npm run db:reset        # Reset database (⚠️ LOSES ALL DATA)

# Quality
npm run lint            # ESLint
npm run type-check      # TypeScript check
npm run test            # Vitest
npm run test:e2e        # Playwright E2E tests
```

## Environment Setup

Required environment variables in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/barberpro"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## Architecture

### Project Structure

```
/src
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages (landing, services, barbers)
│   ├── (auth)/            # Login & Register
│   ├── (dashboard)/       # Client area (mi-cuenta)
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Navbar, Sidebar, Footer
│   ├── providers/         # Auth, Theme, Query providers
│   └── shared/            # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (auth, prisma, validations)
├── server/services/       # Business logic
└── db/                    # Prisma schema, migrations, seed
```

### Routing

**Public Routes:**
- `/` - Landing page
- `/servicios` - Services catalog
- `/barberos` - Staff gallery
- `/reservar` - Public booking page

**Auth Routes:**
- `/login` - Email/password + Google OAuth
- `/registro` - New client registration

**Client Dashboard (`/mi-cuenta`):**
- `/mi-cuenta` - Dashboard with tabs (reservations, history)
- `/mi-cuenta/nueva-reserva` - Multi-step booking wizard
- `/mi-cuenta/perfil` - Profile editing

**Admin Panel (`/admin`):**
- `/admin` - Dashboard with metrics
- `/admin/turnos` - Appointment management
- `/admin/servicios` - Service CRUD
- `/admin/clientes` - Client management
- `/admin/clientes/[id]` - Client detail with history

### Authentication System

- **Provider:** NextAuth with JWT strategy (30-day validity)
- **Methods:** Email/Password (bcrypt) + Google OAuth
- **Roles:** `CLIENT`, `STAFF`, `ADMIN`
- **Test Users (after seeding):**
  - Admin: `admin@barberpro.com` / `Admin123!`
  - Staff: `carlos@barberpro.com` / `User123!`
  - Client: `juan@example.com` / `User123!`

### Database Schema (Prisma)

**Main Entities:**
- `User` - Accounts with role (CLIENT, STAFF, ADMIN)
- `ClientProfile` - Extended client data (notes, tags, preferences)
- `StaffProfile` - Barber profiles (bio, photo, services)
- `Service` - Services offered (name, duration, price, image)
- `Appointment` - Bookings (status: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- `HaircutRecord` - Completed haircut history with photos
- `BusinessHours` - Operating hours by day
- `Closure` - Holiday/vacation closures
- `AuditLog` - Action logging for admin

### API Routes

**Appointments:**
- `GET/POST /api/appointments` - List/Create appointments
- `GET/PATCH/DELETE /api/appointments/[id]` - Single appointment operations
- `POST /api/appointments/available-slots` - Get available time slots

**Services:**
- `GET/POST /api/services` - List/Create services
- `PATCH/DELETE /api/services/[id]` - Update/Delete service

**Clients:**
- `GET /api/clients` - List clients (admin)
- `GET/PATCH /api/clients/[id]` - Client details

**Staff:**
- `GET /api/staff` - List barbers

**Records:**
- `GET/POST /api/records` - Haircut history
- `PATCH/DELETE /api/records/[id]` - Update/Delete record

**Admin:**
- `GET /api/admin/stats` - Dashboard statistics

## Key Patterns

### Working with Appointments
1. Create via `POST /api/appointments` with `serviceId`, `startTime`, optional `staffId`
2. Status flow: `PENDING` → `CONFIRMED` → `COMPLETED` (or `CANCELLED`/`NO_SHOW`)
3. Available slots calculated by `AvailabilityService` considering business hours and existing bookings

### Adding New Features
1. Add Prisma model in `src/db/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Create API route in `src/app/api/`
4. Create hook in `src/hooks/` using TanStack Query
5. Add UI components and pages

### Styling
- Tailwind CSS utility classes
- CSS variables for theming (light/dark mode via `next-themes`)
- Custom colors in `globals.css` (`:root` and `.dark` selectors)
- Responsive: `sm:`, `md:`, `lg:` breakpoints

## Recent Features Added

- ✅ Dark/Light mode toggle in navbar
- ✅ Unified client dashboard with tabs (reservations + history)
- ✅ Improved service cards in booking wizard
- ✅ Admin/Staff role detection in navbar menu
- ✅ Aligned barber cards in gallery

## Known Limitations & TODOs

### Critical (Before Production)
- ❌ Email notifications for appointments (confirmations, reminders)
- ❌ Password reset functionality
- ❌ Photo upload integration (needs S3/Cloudinary)
- ❌ Rate limiting on critical endpoints

### Important
- ⚠️ Test coverage is low (<5%)
- ⚠️ Staff availability not fully validated per barber
- ⚠️ No payment integration (MercadoPago, Stripe)
- ⚠️ No SMS/WhatsApp notifications

### Nice to Have
- Reviews/ratings system
- Recurring appointments
- Google Calendar integration
- PDF reports for admin

## Code Style

- Use comments sparingly - prefer self-documenting code
- Follow existing patterns for hooks, API routes, and components
- Validate inputs with Zod schemas in `src/lib/validations/`
- Use TypeScript strictly - avoid `any` types
- Keep components focused and composable
