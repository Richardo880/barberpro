# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberPro is a barbershop management application built with React, TypeScript, and Vite. It provides appointment booking, staff management, and customer reviews for barbershops. The app uses localStorage as a mock database (no backend server).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

The app requires a `GEMINI_API_KEY` in `.env.local`. The Vite config exposes this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` via `define` configuration.

## Architecture

### Routing & Navigation
- Uses **HashRouter** (not BrowserRouter) - all routes are prefixed with `#` in URLs
- Routes defined in `App.tsx` with `ProtectedRoute` wrapper for authentication
- Protected routes redirect unauthenticated users to `/login`
- Admin routes check for `Role.ADMIN` and redirect non-admins to `/dashboard`

### Authentication System
- `AuthContext` (`contexts/AuthContext.tsx`) provides authentication state globally
- Session persisted in `localStorage` with key `barber_session`
- Login is email-only (password checking is mocked for demo purposes)
- Users have roles: `ADMIN` or `USER` (defined in `types.ts`)
- Default users seeded in `mockDb.ts`:
  - Admin: `admin@barber.com`
  - User: `juan@demo.com`

### Data Layer (mockDb.ts)
All data operations go through `services/mockDb.ts`, which simulates a backend API using localStorage:

**Storage Keys:**
- `barber_users` - User accounts
- `barber_services` - Available services (haircuts, beard trims, etc.)
- `barber_staff` - Staff members and their specialties
- `barber_appointments` - All bookings
- `barber_reviews` - Customer reviews
- `barber_init` - Initialization flag

**Key Services:**
- `authService.login(email)` - Find user by email
- `authService.register(name, email)` - Create new user account
- `dataService.getServices()` - List all services
- `dataService.getStaff()` - List all staff members
- `dataService.getAppointments(userId?, role?)` - Get appointments (filtered by role: admins see all, users see only their own)
- `dataService.createAppointment()` - Book appointment (prevents double-booking)
- `dataService.updateAppointmentStatus(id, status)` - Update appointment status
- `dataService.getAvailableSlots(date, staffId, serviceDuration)` - Get available time slots (9:00 - 18:00, 30-min intervals)
- `dataService.addReview()` - Add review and mark appointment as reviewed
- `dataService.getReviews()` - Get all reviews (newest first)

**Important Data Rules:**
- All service methods return Promises with artificial delays to simulate network latency
- Appointments include joined data (user, staff, service objects) for display
- Time slots are simple exact-match checks (doesn't calculate overlapping ranges)
- Reviews automatically set `hasReview: true` on the associated appointment

### Type System
All types defined in `types.ts`:
- `User` - User accounts with role
- `Service` - Services offered (duration in minutes, price)
- `Staff` - Staff members with service IDs they can perform
- `Appointment` - Bookings with status enum
- `Review` - Customer feedback with 1-5 star rating
- `Slot` - Time slot availability
- Enums: `Role`, `AppointmentStatus`

### UI Components
- `Layout.tsx` - Top navigation bar, user menu, footer (wraps all pages)
- `components/ui/Button.tsx` - Reusable button with variants
- Pages in `pages/` directory:
  - `Home.tsx` - Landing page
  - `Auth.tsx` - Login and Register forms
  - `Dashboard.tsx` - User's appointments list with cancel/review actions
  - `BookingWizard.tsx` - Multi-step booking flow (service → staff → date/time)
  - `AdminPanel.tsx` - Admin view of all appointments and stats

### Path Aliases
The project uses `@/*` alias pointing to root directory (configured in both `tsconfig.json` and `vite.config.ts`). However, most imports use relative paths.

## Common Patterns

### Working with Appointments
When modifying appointment logic:
1. Status changes go through `dataService.updateAppointmentStatus()`
2. Always check `role` when fetching appointments (admins vs users have different views)
3. Join operations happen in `getAppointments()` - it populates `user`, `staff`, `service` nested objects
4. Status enum values: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`

### Adding New Features
- New data entities need storage key added to `STORAGE_KEYS` in `mockDb.ts`
- Seed data should be added in `initDb()` initialization
- New types should be defined in `types.ts`
- Protected pages need `<ProtectedRoute>` wrapper in `App.tsx`

### Styling
- Uses Tailwind CSS utility classes (no separate CSS files)
- Custom colors defined via `primary-*` classes (assumed to be configured in Tailwind config)
- Responsive breakpoints: `sm:`, `md:`, `lg:`

## Code Style

### Comments
Use comments sparingly. Only comment complex code where the logic isn't self-evident. Prefer writing self-documenting code with clear variable and function names over adding explanatory comments.

## Known Limitations
- No real backend - all data in localStorage (clears on cache clear)
- Password validation is mocked (any password works if email exists)
- Time slot overlap detection is basic (exact time match only)
- No TypeScript strict mode enabled
- No test suite present
