import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashedPassword123"),
  },
}));

describe("Registration API Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "user-123",
      name: "Test User",
      email: "newuser@test.com",
      phone: "+595981234567",
      role: "CLIENT",
      createdAt: new Date(),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "newuser@test.com",
        phone: "+595981234567",
        password: "Password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Usuario registrado exitosamente");
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("newuser@test.com");
    expect(data.user.name).toBe("Test User");
    expect(data.user.role).toBe("CLIENT");
  });

  it("should fail with duplicate email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "existing-user",
      email: "duplicate@test.com",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Another User",
        email: "duplicate@test.com",
        password: "Password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("ya está registrado");
  });

  it("should fail with weak password - too short", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "weakpass@test.com",
        password: "weak",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should fail with password missing uppercase", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "nouppercase@test.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("mayúscula");
  });

  it("should fail with invalid email format", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        password: "Password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should register without phone number", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "user-456",
      name: "Test User",
      email: "nophone@test.com",
      phone: null,
      role: "CLIENT",
      createdAt: new Date(),
    } as any);

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "nophone@test.com",
        password: "Password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.phone).toBeNull();
  });

  it("should fail with invalid phone format", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "badphone@test.com",
        phone: "0123456", // Invalid: starts with 0
        password: "Password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should hash password correctly", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "user-789",
      name: "Test User",
      email: "hashtest@test.com",
      phone: null,
      role: "CLIENT",
      createdAt: new Date(),
    } as any);

    const password = "Password123";

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "hashtest@test.com",
        password,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: "hashedPassword123",
        }),
      })
    );
  });
});
