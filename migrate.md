# BarberPro Mobile - Migration Log

Full log of migrating the BarberPro Next.js 15 web app to React Native + Expo for Android/iOS.

---

## Phase 0: Backend Preparation

### 0.1 New endpoint: `POST /api/auth/mobile-login`
- **File created:** `barberpro-nuevo/src/app/api/auth/mobile-login/route.ts`
- Accepts `{ email, password }`, validates with `loginSchema`
- Verifies password with bcrypt
- Signs a JWT with `jsonwebtoken` using `NEXTAUTH_SECRET` (30-day expiry)
- Returns `{ token, user: { id, email, name, role } }`

### 0.2 New endpoint: `POST /api/auth/mobile-google`
- **File created:** `barberpro-nuevo/src/app/api/auth/mobile-google/route.ts`
- Accepts Google ID token from Expo OAuth flow
- Verifies with Google, finds/creates user, returns BarberPro JWT

### 0.3 Auth middleware helper
- **File created:** `barberpro-nuevo/src/lib/auth-mobile.ts`
- `signMobileToken()` - signs JWT with user payload
- `verifyMobileToken()` - verifies JWT and returns user data
- `getSessionFromRequest(request)` - checks `Authorization: Bearer <token>` first, falls back to `getServerSession(authOptions)` for web compatibility

### 0.4 Updated existing API routes to use `getSessionFromRequest`
- `barberpro-nuevo/src/app/api/appointments/route.ts` (GET, POST)
- `barberpro-nuevo/src/app/api/appointments/[id]/route.ts` (GET, PATCH, DELETE)
- `barberpro-nuevo/src/app/api/records/route.ts` (GET, POST)
- `barberpro-nuevo/src/app/api/users/[id]/route.ts` (PATCH)
- `barberpro-nuevo/src/app/api/users/[id]/password/route.ts` (PATCH)

### 0.5 Updated middleware for mobile support
- **File modified:** `barberpro-nuevo/src/middleware.ts`
- The NextAuth `withAuth` middleware was blocking mobile Bearer token requests
- Updated `authorized` callback to detect `Authorization: Bearer` headers and let them pass through to route handlers
- Added `/api/appointments/available-slots` as a public endpoint exception (no auth needed)
- Web clients still require NextAuth session cookies as before

### 0.6 Dependencies added to backend
- `jsonwebtoken`, `@types/jsonwebtoken`

---

## Phase 1: Expo Project Setup

### 1.1 Project created
```bash
npx create-expo-app@latest barberpro-mobile --template tabs
```
New project at `/home/ricardo/barberpro-mobile/`

### 1.2 Dependencies installed
**Runtime:**
- `nativewind@^4.2`, `tailwindcss@^3.4` (NativeWind v4)
- `expo-router@~6.0` (file-based routing)
- `expo-secure-store` (JWT storage)
- `expo-image` (optimized images)
- `@tanstack/react-query@^5` (data fetching)
- `react-hook-form@^7`, `@hookform/resolvers` (forms)
- `zod@^4` (validation)
- `date-fns@^4`, `date-fns-tz@^3` (dates)
- `lucide-react-native`, `react-native-svg` (icons)
- `expo-auth-session`, `expo-web-browser`, `expo-crypto` (Google OAuth)
- `react-native-calendars` (calendar picker)
- `react-native-toast-message` (toasts)
- `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`
- `@react-native-async-storage/async-storage` (theme persistence)

### 1.3 NativeWind v4 configured
- **`tailwind.config.js`** - content paths, `nativewind/preset`, CSS variable-based color tokens
- **`global.css`** - Tailwind directives + CSS custom properties for light/dark themes using `:root` and `@media (prefers-color-scheme: dark)`
- **`babel.config.js`** - `babel-preset-expo` with `jsxImportSource: "nativewind"` + `nativewind/babel` preset
- **`metro.config.js`** - `withNativeWind` wrapper with `input: "./global.css"`
- **`nativewind-env.d.ts`** - TypeScript reference for NativeWind types

### 1.4 App configuration
- **`app.json`** - Expo config with `com.barberpro.app` package, dark splash screen, `expo-router` and `expo-secure-store` plugins

---

## Phase 2: Core Infrastructure

### 2.1 API Client
- **File:** `src/lib/api-client.ts`
- Centralized `apiClient<T>(path, options)` function
- Prepends `API_BASE_URL` (Android emulator: `http://10.0.2.2:3000`, iOS: LAN IP)
- Injects `Authorization: Bearer <token>` from secure store
- Handles 401 by clearing token + triggering logout
- `skipAuth` option for public endpoints

### 2.2 Auth Storage
- **File:** `src/lib/auth-storage.ts`
- `saveToken()`, `getToken()`, `removeToken()` via `expo-secure-store`
- `saveUser()`, `getUser()`, `removeUser()`, `clearAuth()` for cached user data

### 2.3 Auth Provider
- **File:** `src/providers/AuthProvider.tsx`
- Context: `{ user, isLoading, isAuthenticated, login, register, logout }`
- On startup: reads token/user from secure store
- Login: `POST /api/auth/mobile-login` -> store token -> set user
- Register: `POST /api/auth/register` -> auto-login
- Exposes `useAuth()` hook

### 2.4 Query Provider
- **File:** `src/providers/QueryProvider.tsx`
- TanStack Query config: `staleTime: 5min, gcTime: 10min, retry: 2`
- `AppState` listener for `focusManager` (replaces `refetchOnWindowFocus`)

### 2.5 Theme Provider
- **File:** `src/providers/ThemeProvider.tsx`
- Uses NativeWind's `useColorScheme` from `"nativewind"` to sync dark/light mode with CSS variables
- Manual override stored in `AsyncStorage`
- Default: dark mode
- Provides `{ theme, isDark, toggleTheme, setTheme }` context

### 2.6 Booking Provider
- **File:** `src/providers/BookingProvider.tsx`
- Shared state for the 4-step booking wizard
- Stores: `serviceId`, `staffId`, `date`, `timeSlot`, `startTime`, `notes`
- `reset()` to clear wizard state

### 2.7 Config & Constants
- **`src/constants/config.ts`** - `API_BASE_URL` with platform-specific selection (Android emulator vs iOS/physical device)
- **`src/constants/colors.ts`** - Hardcoded light/dark theme color values for use in non-NativeWind contexts (e.g., icons, calendar theme)
- **`src/constants/status.ts`** - Appointment status colors, backgrounds, labels in Spanish

### 2.8 Types
- **`src/types/index.ts`** - `AuthUser`, `Service`, `StaffMember`, `Appointment`, `TimeSlot`, `HaircutRecord`, `PaginationMeta`

---

## Phase 3: Hooks (adapted from web)

Mechanical transformation: replaced `fetch("/api/...")` with `apiClient("/api/...")`, removed `"use client"`, replaced `useToast()` with `Toast.show()`.

| File | Exports |
|------|---------|
| `src/hooks/use-appointments.ts` | `useAppointments`, `useCreateAppointment`, `useUpdateAppointment`, `useCancelAppointment`, `useAvailableSlots` |
| `src/hooks/use-services.ts` | `useServices` |
| `src/hooks/use-staff.ts` | `useStaff` |
| `src/hooks/use-records.ts` | `useRecords` |
| `src/hooks/use-users.ts` | `useUpdateProfile`, `useChangePassword` |
| `src/hooks/use-promotion.ts` | `usePromotion`, `isPromoActive`, `getDiscountedPrice` |

---

## Phase 4: UI Components

| Component | File | Description |
|-----------|------|-------------|
| Button | `src/components/ui/Button.tsx` | Pressable with variants (default, destructive, outline, ghost, secondary) |
| Card | `src/components/ui/Card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input | `src/components/ui/Input.tsx` | TextInput with label, error state, password toggle |
| Badge | `src/components/ui/Badge.tsx` | Badge with variants and custom color support |
| Avatar | `src/components/ui/Avatar.tsx` | expo-image with initials fallback |
| SegmentedControl | `src/components/ui/SegmentedControl.tsx` | Tab-like segmented control |
| ProgressBar | `src/components/ui/ProgressBar.tsx` | Animated progress bar for wizard |
| EmptyState | `src/components/shared/EmptyState.tsx` | Icon + title + description + optional CTA |
| LoadingSpinner | `src/components/shared/LoadingSpinner.tsx` | ActivityIndicator wrapper |
| ServiceCard | `src/components/services/ServiceCard.tsx` | Service display with promotion pricing |
| AppointmentCard | `src/components/appointments/AppointmentCard.tsx` | Appointment with status badge, cancel |
| StaffCard | `src/components/staff/StaffCard.tsx` | Staff avatar, bio, service badges |

---

## Phase 5: Navigation

### Root Layout (`app/_layout.tsx`)
- Wraps everything: `ThemeProvider > QueryProvider > AuthProvider > BookingProvider > AuthGate > Stack`
- `AuthGate`: redirects unauthenticated users to `(auth)/login`, authenticated users to `(tabs)`
- Imports `global.css` for NativeWind

### Tab Navigator (`app/(tabs)/_layout.tsx`)
5 bottom tabs:

| Tab | Icon | Screen(s) |
|-----|------|-----------|
| Inicio | `Home` | Home dashboard |
| Servicios | `Scissors` | Services catalog |
| Reservar | `PlusCircle` | 4-step booking wizard (stack) |
| Turnos | `Calendar` | Appointments list |
| Perfil | `User` | Profile menu -> edit, password, history |

### Auth Stack (`app/(auth)/_layout.tsx`)
- Login and Register screens

---

## Phase 6: Screens

### Auth
- **`app/(auth)/login.tsx`** - Email/password login with `react-hook-form`, Google sign-in button, link to register
- **`app/(auth)/register.tsx`** - Name, email, phone, password, confirmPassword; auto-login on success

### Tabs
- **`app/(tabs)/index.tsx`** - Home: logo, greeting, "Nueva Reserva" button, stats cards (pending appointments, total cuts, last cut date), next appointment card, quick links
- **`app/(tabs)/services.tsx`** - Services FlatList with ServiceCard, pull-to-refresh, "Reservar" button per service
- **`app/(tabs)/appointments.tsx`** - SegmentedControl (Proximas/Pasadas), FlatList of AppointmentCard, cancel with confirmation, pull-to-refresh

### Booking Wizard (`app/(tabs)/booking/`)
- **`_layout.tsx`** - Stack navigator for wizard steps
- **`index.tsx`** (Step 1) - Service selection with highlighted selection
- **`staff.tsx`** (Step 2) - Staff selection + "Sin preferencia" option
- **`datetime.tsx`** (Step 3) - `react-native-calendars` Calendar + time slot grid from `useAvailableSlots`
- **`confirm.tsx`** (Step 4) - Summary card + notes input + confirm button + success modal

### Profile (`app/(tabs)/profile/`)
- **`_layout.tsx`** - Stack navigator
- **`index.tsx`** - Avatar, user info, menu list (Edit, Password, History, Theme toggle, Logout)
- **`edit.tsx`** - Name, email (disabled), phone fields with `useUpdateProfile`
- **`password.tsx`** - Current/new/confirm password with `useChangePassword`
- **`history.tsx`** - FlatList of records with photo thumbnails, tap to view full-screen modal

### Other
- **`app/+not-found.tsx`** - 404 screen with link back to home

---

## Phase 7: Bug Fixes & Testing

### Fix 1: NativeWind CSS not applied
- **Problem:** App loaded on iPhone but all styles were missing (plain unstyled elements)
- **Root cause:** Missing `babel.config.js`. NativeWind v4 requires `nativewind/babel` preset and `jsxImportSource: "nativewind"` to transform `className` props into React Native styles.
- **Fix:** Created `babel.config.js` with both presets.

### Fix 2: Dark mode not working
- **Problem:** Theme toggle had no effect; always showed light mode colors
- **Root cause:** `global.css` used `.dark { ... }` CSS class selector, but NativeWind v4 uses `@media (prefers-color-scheme: dark)` to switch CSS variables.
- **Fix:** Changed `global.css` from `.dark { ... }` to `@media (prefers-color-scheme: dark) { :root { ... } }`. Updated `ThemeProvider` to use NativeWind's `useColorScheme` + `setColorScheme()` to control the media query evaluation.

### Fix 3: History empty / backend communication broken
- **Problem:** Records, appointments, and available-slots API calls all failed from mobile
- **Root cause:** Next.js middleware (`src/middleware.ts`) used NextAuth's `withAuth` which only checks for session cookies. Mobile requests with Bearer tokens were blocked and redirected to `/login` before reaching route handlers.
- **Fix:** Updated the middleware `authorized` callback to detect `Authorization: Bearer` headers and return `true` (letting them through). Added `/api/appointments/available-slots` as a public endpoint exception. Route handlers still verify tokens via `getSessionFromRequest()`.

### Fix 4: Calendar date picker not responding on iOS
- **Problem:** Tapping dates in the booking calendar did nothing
- **Root cause:** `react-native-calendars` inside a `ScrollView` had gesture conflicts on iOS. Also, `markedDates` was initialized with empty string key `{ "": {...} }`.
- **Fix:** Added `nestedScrollEnabled` and `keyboardShouldPersistTaps="handled"` to ScrollView, `enableSwipeMonths={false}` to Calendar, and fixed `markedDates` to pass `{}` when no date is selected.

### Fix 5: Logo missing on home screen
- **Problem:** No logo/branding on the home dashboard
- **Fix:** Copied `logo.jpeg` from web project (`barberpro-nuevo/public/images/menu/logo.jpeg`) to `assets/images/logo.jpeg`. Added `expo-image` logo display next to the greeting text.

---

## Phase 8: Android Studio Setup (WSL2)

### Environment configuration
Android SDK is at `F:\SDK-ANDROID-STUDIO` (Windows), mounted at `/mnt/f/SDK-ANDROID-STUDIO` in WSL2.

**`.bashrc` additions:**
```bash
export ANDROID_HOME=/mnt/f/SDK-ANDROID-STUDIO
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$HOME/.local/bin:$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

### WSL2-specific fixes
- **ADB symlink:** Created `adb` -> `adb.exe` in `/mnt/f/SDK-ANDROID-STUDIO/platform-tools/` because Expo constructs `$ANDROID_HOME/platform-tools/adb` without `.exe`
- **Emulator symlink:** Created `emulator` -> `emulator.exe` similarly
- **Linux JDK:** Installed `openjdk-21-jdk` via apt because Gradle cannot use the Windows JDK (it looks for Linux binaries in `$JAVA_HOME/bin/java`)
- **`android/local.properties`:** `sdk.dir=/mnt/f/SDK-ANDROID-STUDIO`

### Build & Run
```bash
# Generate Android native project
npx expo prebuild --platform android --clean

# Start emulator
/mnt/f/SDK-ANDROID-STUDIO/emulator/emulator.exe -avd Medium_Phone_API_36.1

# Port forwarding (emulator -> host)
adb reverse tcp:3000 tcp:3000   # Backend
adb reverse tcp:8081 tcp:8081   # Metro bundler

# Build and install
ANDROID_HOME=/mnt/f/SDK-ANDROID-STUDIO JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 npx expo run:android
```

Build completed successfully (BUILD SUCCESSFUL in ~13 min, 294 tasks). App installed on `Medium_Phone_API_36.1` emulator.

### API URL routing
- **`src/constants/config.ts`**: Android emulator uses `http://10.0.2.2:3000` (special alias for host localhost), iOS/physical devices use `http://192.168.100.91:3000` (Windows LAN IP)

---

## Files Created/Modified Summary

### Backend (`barberpro-nuevo`) - Modified
| File | Action |
|------|--------|
| `src/lib/auth-mobile.ts` | Created - JWT sign/verify + dual auth helper |
| `src/app/api/auth/mobile-login/route.ts` | Created - email/password -> JWT |
| `src/app/api/auth/mobile-google/route.ts` | Created - Google OAuth -> JWT |
| `src/middleware.ts` | Modified - Bearer token passthrough + public endpoint exceptions |
| `src/app/api/appointments/route.ts` | Modified - `getSessionFromRequest` |
| `src/app/api/appointments/[id]/route.ts` | Modified - `getSessionFromRequest` |
| `src/app/api/records/route.ts` | Modified - `getSessionFromRequest` |
| `src/app/api/users/[id]/route.ts` | Modified - `getSessionFromRequest` |
| `src/app/api/users/[id]/password/route.ts` | Modified - `getSessionFromRequest` |
| `package.json` | Modified - added jsonwebtoken deps |

### Mobile (`barberpro-mobile`) - Created
| Category | Files |
|----------|-------|
| Config | `app.json`, `babel.config.js`, `tailwind.config.js`, `global.css`, `metro.config.js`, `nativewind-env.d.ts`, `tsconfig.json`, `android/local.properties` |
| Constants | `src/constants/config.ts`, `src/constants/colors.ts`, `src/constants/status.ts` |
| Types | `src/types/index.ts` |
| Lib | `src/lib/api-client.ts`, `src/lib/auth-storage.ts` |
| Providers | `src/providers/AuthProvider.tsx`, `src/providers/QueryProvider.tsx`, `src/providers/ThemeProvider.tsx`, `src/providers/BookingProvider.tsx` |
| Hooks | `src/hooks/use-appointments.ts`, `src/hooks/use-services.ts`, `src/hooks/use-staff.ts`, `src/hooks/use-records.ts`, `src/hooks/use-users.ts`, `src/hooks/use-promotion.ts` |
| UI Components | `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`, `Avatar.tsx`, `SegmentedControl.tsx`, `ProgressBar.tsx` |
| Shared Components | `src/components/shared/EmptyState.tsx`, `src/components/shared/LoadingSpinner.tsx` |
| Feature Components | `src/components/services/ServiceCard.tsx`, `src/components/appointments/AppointmentCard.tsx`, `src/components/staff/StaffCard.tsx` |
| Screens | `app/_layout.tsx`, `app/+not-found.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/services.tsx`, `app/(tabs)/appointments.tsx`, `app/(tabs)/booking/_layout.tsx`, `app/(tabs)/booking/index.tsx`, `app/(tabs)/booking/staff.tsx`, `app/(tabs)/booking/datetime.tsx`, `app/(tabs)/booking/confirm.tsx`, `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/profile/index.tsx`, `app/(tabs)/profile/edit.tsx`, `app/(tabs)/profile/password.tsx`, `app/(tabs)/profile/history.tsx` |
| Assets | `assets/images/logo.jpeg` (copied from web project) |

### System (`~/.bashrc`) - Modified
- Added `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `JAVA_HOME`, PATH entries for Android development in WSL2
