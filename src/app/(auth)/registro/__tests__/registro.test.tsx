import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import RegisterPage from "../page";

vi.mock("next-auth/react");

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders registration form with all fields", () => {
    render(<RegisterPage />);

    const headings = screen.getAllByText("Crear Cuenta");
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const nameError = await screen.findByText(/el nombre debe tener al menos 2 caracteres/i, {}, { timeout: 5000 });
    expect(nameError).toBeInTheDocument();

    const emailError = await screen.findByText(/email inválido/i, {}, { timeout: 5000 });
    expect(emailError).toBeInTheDocument();
  });

  it("validates password requirements", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "weak");
    await user.type(confirmPasswordInput, "weak");

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const errorMessage = await screen.findByText(/la contraseña debe tener al menos 8 caracteres/i, {}, { timeout: 5000 });
    expect(errorMessage).toBeInTheDocument();
  });

  it("validates password must contain uppercase letter", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "lowercase123");
    await user.type(confirmPasswordInput, "lowercase123");

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const errorMessage = await screen.findByText(/debe contener al menos una mayúscula/i, {}, { timeout: 5000 });
    expect(errorMessage).toBeInTheDocument();
  });

  it("validates password must contain number", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "NoNumbersX");
    await user.type(confirmPasswordInput, "NoNumbersX");

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const errorMessage = await screen.findByText(/debe contener al menos un número/i, {}, { timeout: 5000 });
    expect(errorMessage).toBeInTheDocument();
  });

  it("validates password confirmation matches", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password456");

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const errorMessage = await screen.findByText(/las contraseñas no coinciden/i, {}, { timeout: 5000 });
    expect(errorMessage).toBeInTheDocument();
  });

  it("validates phone number format", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(phoneInput, "abc123");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password123");

    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });
    await user.click(submitButton);

    const errorMessage = await screen.findByText(/teléfono inválido/i, {}, { timeout: 5000 });
    expect(errorMessage).toBeInTheDocument();
  });

  it("successfully registers user and auto-logs in", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);
    const mockSignIn = vi.mocked(signIn);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "user-1", name: "Juan Pérez" } }),
    } as Response);

    mockSignIn.mockResolvedValueOnce({ ok: true, error: null } as any);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Juan Pérez",
            email: "juan@test.com",
            phone: undefined,
            password: "Password123",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "juan@test.com",
        password: "Password123",
        redirect: false,
      });
    });
  });

  it("handles registration API error", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "El email ya está registrado" }),
    } as Response);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "existing@test.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("disables form inputs while submitting", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const submitButton = screen.getByRole("button", { name: /crear cuenta/i });

    await user.type(nameInput, "Juan Pérez");
    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "Password123");
    await user.click(submitButton);

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("has link to login page", () => {
    render(<RegisterPage />);

    const loginLink = screen.getByRole("link", { name: /inicia sesión aquí/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
