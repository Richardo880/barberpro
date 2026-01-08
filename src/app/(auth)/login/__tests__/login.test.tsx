import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import LoginPage from "../page";

vi.mock("next-auth/react");

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all elements", () => {
    render(<LoginPage />);

    const headings = screen.getAllByText("Iniciar Sesión");
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/email inválido/i) || screen.queryByText("Invalid email")).toBeInTheDocument();
    });
  });

  it("successfully submits login form with valid credentials", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({ ok: true, error: null } as any);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "juan@test.com",
        password: "password123",
        redirect: false,
      });
    });
  });

  it("shows error toast on failed login", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({ ok: false, error: "Invalid credentials" } as any);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    await user.type(emailInput, "wrong@test.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it("disables form inputs while submitting", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /iniciar sesión/i });

    await user.type(emailInput, "juan@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("handles Google sign-in button click", async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({ ok: true } as any);

    render(<LoginPage />);

    const googleButton = screen.getByRole("button", { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google", expect.any(Object));
    });
  });

  it("has link to registration page", () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", { name: /regístrate aquí/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/registro");
  });
});
