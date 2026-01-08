import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Registration API Integration Tests", () => {
  // Cleanup después de cada test
  afterEach(async () => {
    await prisma.clientProfile.deleteMany({
      where: {
        user: {
          email: {
            contains: "@test-integration.com",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@test-integration.com",
        },
      },
    });
  });

  it("should register a new user successfully", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "newuser@test-integration.com",
        phone: "+595981234567",
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Usuario registrado exitosamente");
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("newuser@test-integration.com");
    expect(data.user.name).toBe("Test User");
    expect(data.user.role).toBe("CLIENT");

    // Verificar que el usuario existe en la base de datos
    const dbUser = await prisma.user.findUnique({
      where: { email: "newuser@test-integration.com" },
      include: { clientProfile: true },
    });

    expect(dbUser).toBeDefined();
    expect(dbUser?.clientProfile).toBeDefined();
  });

  it("should fail with duplicate email", async () => {
    // Primer registro
    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "duplicate@test-integration.com",
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    // Segundo registro con el mismo email
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another User",
        email: "duplicate@test-integration.com",
        password: "Password456",
        confirmPassword: "Password456",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("ya está registrado");
  });

  it("should fail with weak password", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "weakpass@test-integration.com",
        password: "weak", // No uppercase, no number, too short
        confirmPassword: "weak",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should fail with mismatched passwords", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "mismatch@test-integration.com",
        password: "Password123",
        confirmPassword: "Password456",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("no coinciden");
  });

  it("should fail with invalid email format", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("inválido");
  });

  it("should register without phone number", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "nophone@test-integration.com",
        password: "Password123",
        confirmPassword: "Password123",
        // phone is optional
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.phone).toBeNull();
  });

  it("should fail with invalid phone format", async () => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "badphone@test-integration.com",
        phone: "123", // Invalid format
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should hash password correctly", async () => {
    const password = "Password123";

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "hashtest@test-integration.com",
        password,
        confirmPassword: password,
      }),
    });

    expect(response.status).toBe(201);

    // Verificar que la contraseña está hasheada en la BD
    const dbUser = await prisma.user.findUnique({
      where: { email: "hashtest@test-integration.com" },
    });

    expect(dbUser?.passwordHash).toBeDefined();
    expect(dbUser?.passwordHash).not.toBe(password);
    expect(dbUser?.passwordHash.length).toBeGreaterThan(50); // bcrypt hash es largo
  });
});
