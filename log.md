# Session Log - 2026-01-31

## 1. Test Fixes

### Initial State
- 6 test files with 68 tests total
- 24 tests failing

### Issues Fixed

#### Integration Tests (`register.integration.test.ts`)
- **Problem**: Tests used `fetch("http://localhost:3000/...")` requiring a running server
- **Solution**: Converted to unit tests with mocked Prisma and bcrypt

#### Appointments Route Tests (`route.test.ts`)
- **Problem**: Missing `authOptions` mock, incorrect status filter format, invalid CUID IDs
- **Solution**:
  - Added `vi.mock("@/lib/auth", () => ({ authOptions: {} }))`
  - Changed status expectation from string to array format `{ in: ["PENDING"] }`
  - Used valid CUIDs from mockData

#### useAppointments Hook Tests (`use-appointments.test.tsx`)
- **Problem**: `useAvailableSlots` signature mismatch - tests passed object but hook uses individual params
- **Solution**: Updated tests to use individual parameters `(serviceId, date, staffId)`

#### Login and Registration Tests
- **Problem**: Zod v4 + react-hook-form compatibility issue causing unhandled rejections
- **Solution**: Upgraded `@hookform/resolvers` from v3.10.0 to v5.2.2 (GitHub Issue #12816)

### Final State
- All 68 tests passing

---

## 2. Promotional Discount Feature

### Problem
When a promo day discount was applied, the client history showed the original service price instead of the discounted price.

### Root Cause
In `/api/appointments/[id]/route.ts`, when creating a `HaircutRecord` on appointment completion, the code used `updated.service.price` (original price) instead of calculating the discounted price.

### Solution Implemented

#### Database Schema Changes
Added audit fields to `HaircutRecord` model in `src/db/schema.prisma`:
```prisma
model HaircutRecord {
  // ... existing fields ...
  originalPrice    Decimal?  @db.Decimal(10, 2)
  discountAmount   Decimal?  @db.Decimal(10, 2)
  promotionApplied Boolean   @default(false)
}
```

#### New Service Created
`/src/server/services/promotion.service.ts`:
- `getPromotionConfig()` - Fetches promo settings from AppConfig table
- `isPromoDayForDate()` - Checks if a date is a promo day
- `calculatePrice()` - Calculates price with discount
- `calculatePriceWithPromotion()` - Convenience function combining config fetch and calculation

#### API Routes Updated

**`/src/app/api/appointments/[id]/route.ts`**:
- When status changes to COMPLETED, now calculates discounted price using promotion service
- Stores `price`, `originalPrice`, `discountAmount`, and `promotionApplied` in HaircutRecord

**`/src/app/api/records/route.ts`**:
- POST endpoint now supports new audit fields for manual record creation
- Calculates discount fields automatically if not provided

#### UI Pages Updated (3 files)

All pages now display promotional discounts with:
- Discounted price in bold green
- Original price with strikethrough
- Green "Promo" badge with tag icon

1. `/src/app/(dashboard)/mi-cuenta/historial/page.tsx`
2. `/src/app/(dashboard)/mi-cuenta/page.tsx`
3. `/src/app/admin/clientes/[id]/page.tsx`

### Files Modified
- `src/db/schema.prisma`
- `src/server/services/promotion.service.ts` (new)
- `src/app/api/appointments/[id]/route.ts`
- `src/app/api/records/route.ts`
- `src/app/(dashboard)/mi-cuenta/historial/page.tsx`
- `src/app/(dashboard)/mi-cuenta/page.tsx`
- `src/app/admin/clientes/[id]/page.tsx`

### Verification
- All 68 tests passing
- TypeScript compilation successful for main code (pre-existing test type issues remain)
