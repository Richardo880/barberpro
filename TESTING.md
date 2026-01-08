# Testing Guide - BarberPro

This document describes the testing setup and how to run tests for the BarberPro application.

## Test Stack

- **Vitest**: Fast unit test framework
- **React Testing Library**: Testing React components
- **@testing-library/user-event**: Simulating user interactions
- **jsdom**: DOM environment for Node.js

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup and mocks
│   ├── test-utils.tsx        # Custom render with providers
│   └── mockData.ts           # Shared mock data
├── app/
│   ├── (auth)/
│   │   ├── login/__tests__/
│   │   │   └── login.test.tsx
│   │   └── registro/__tests__/
│   │       └── registro.test.tsx
│   ├── (dashboard)/
│   │   └── mi-cuenta/
│   │       └── nueva-reserva/__tests__/
│   │           └── nueva-reserva.test.tsx
│   └── api/
│       └── appointments/__tests__/
│           └── route.test.ts
└── hooks/
    └── __tests__/
        └── use-appointments.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- login.test.tsx
```

### Run tests matching a pattern
```bash
npm test -- --grep "booking"
```

## Test Coverage

The test suite covers the following user flows:

### 1. Authentication Flow
- **Location**: `src/app/(auth)/login/__tests__/login.test.tsx`
- **Scenarios**:
  - Renders login form with all elements
  - Validates empty fields
  - Validates invalid email format
  - Successfully logs in with valid credentials
  - Shows error on failed login
  - Disables form while submitting
  - Google sign-in flow
  - Link to registration page

- **Location**: `src/app/(auth)/registro/__tests__/registro.test.tsx`
- **Scenarios**:
  - Renders registration form with all fields
  - Validates required fields
  - Validates password requirements (length, uppercase, number)
  - Validates password confirmation matches
  - Validates phone number format
  - Successfully registers and auto-logs in
  - Handles registration errors
  - Link to login page

### 2. Booking Wizard Flow
- **Location**: `src/app/(dashboard)/mi-cuenta/nueva-reserva/__tests__/nueva-reserva.test.tsx`
- **Scenarios**:
  - Step 1: Service selection with details
  - Step 2: Staff selection (including "no preference")
  - Step 3: Date and time slot selection
  - Step 4: Confirmation with notes
  - Navigation between steps (forward/back)
  - Progress bar updates
  - Loading states
  - Selected service displayed across steps

### 3. Appointment Hooks
- **Location**: `src/hooks/__tests__/use-appointments.test.ts`
- **Scenarios**:
  - Fetches appointments with filters
  - Creates new appointments
  - Cancels appointments
  - Fetches available time slots
  - Handles API errors
  - Query parameter validation

### 4. API Routes
- **Location**: `src/app/api/appointments/__tests__/route.test.ts`
- **Scenarios**:
  - GET: Authentication check
  - GET: Role-based filtering (CLIENT vs ADMIN)
  - GET: Status and date range filters
  - GET: Pagination
  - POST: Creates appointments
  - POST: Validates service availability
  - POST: Detects time conflicts
  - POST: Input validation

## Mock Data

Shared mock data is available in `src/test/mockData.ts`:
- `mockUser`: Sample client user
- `mockAdmin`: Sample admin user
- `mockServices`: Array of barbershop services
- `mockStaff`: Array of staff members
- `mockAppointment`: Sample appointment
- `mockAvailableSlots`: Sample time slots

## Writing New Tests

### Component Tests

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import YourComponent from "../YourComponent";

describe("YourComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText(/some text/i)).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useYourHook } from "../useYourHook";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useYourHook", () => {
  it("fetches data successfully", async () => {
    const { result } = renderHook(() => useYourHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### API Route Tests

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("GET /api/your-route", () => {
  it("returns 401 for unauthenticated users", async () => {
    const request = new NextRequest("http://localhost:3000/api/your-route");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   // Arrange
   const user = userEvent.setup();
   render(<Component />);

   // Act
   await user.click(button);

   // Assert
   expect(screen.getByText(/success/i)).toBeInTheDocument();
   ```

2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`

3. **Wait for async operations**: Always use `waitFor` for async updates

4. **Mock external dependencies**: Mock API calls, navigation, authentication

5. **Clean up**: Use `beforeEach` to reset mocks and state

6. **Test user behavior**: Test what users see and do, not implementation details

## Continuous Integration

Tests run automatically on:
- Git pre-commit hooks (via husky)
- Pull request builds
- Main branch commits

Ensure all tests pass before committing:
```bash
npm test
```

## Troubleshooting

### Tests timing out
Increase timeout in specific tests:
```typescript
it("slow test", async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock not working
Ensure mocks are defined before imports:
```typescript
vi.mock("@/hooks/use-auth");
import Component from "./Component"; // Import after mock
```

### DOM queries failing
Check the rendered output:
```typescript
import { screen } from "@/test/test-utils";
screen.debug(); // Prints current DOM
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
