import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockAdmin, mockUser, mockStaff, mockServices } from "@/test/mockData";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

describe("GET /api/staff", () => {
  const mockStaffList = [
    {
      id: mockStaff[0].id,
      name: mockStaff[0].name,
      email: mockStaff[0].email,
      phone: "+595991234567",
      staffProfile: {
        id: "profile-1",
        bio: "Barbero profesional",
        photoUrl: "https://example.com/photo.jpg",
        specialties: ["cortes", "barba"],
        isActive: true,
        services: mockServices,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active staff by default (no auth required)", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockStaffList as any);

    const request = new NextRequest("http://localhost:3000/api/staff");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.staff).toBeDefined();
    expect(data.staff).toHaveLength(1);
  });

  it("filters by role STAFF", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/staff");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "STAFF",
        }),
      })
    );
  });

  it("filters by isActive true by default", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/staff");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          staffProfile: { isActive: true },
        }),
      })
    );
  });

  it("returns 403 if non-admin tries to include inactive", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff?includeInactive=true");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns all staff for admin with includeInactive=true", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockStaffList as any);

    const request = new NextRequest("http://localhost:3000/api/staff?includeInactive=true");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("orders by name ascending", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/staff");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("flattens staff profile in response", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockStaffList as any);

    const request = new NextRequest("http://localhost:3000/api/staff");
    const response = await GET(request);
    const data = await response.json();

    expect(data.staff[0].bio).toBe("Barbero profesional");
    expect(data.staff[0].services).toBeDefined();
    expect(data.staff[0].staffProfileId).toBe("profile-1");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/staff");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("POST /api/staff", () => {
  const validStaffData = {
    name: "Nuevo Barbero",
    email: "nuevo@barberpro.com",
    password: "Password123",
    phone: "+595991234567",
    bio: "Barbero experto",
    specialties: ["cortes", "barba"],
    serviceIds: [mockServices[0].id],
  };

  const createdStaff = {
    id: "new-staff-id",
    name: validStaffData.name,
    email: validStaffData.email,
    phone: validStaffData.phone,
    staffProfile: {
      bio: validStaffData.bio,
      photoUrl: null,
      specialties: validStaffData.specialties,
      isActive: true,
      services: mockServices,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 if not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify(validStaffData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if staff tries to create", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify(validStaffData),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("creates staff successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(createdStaff as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify(validStaffData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Miembro del staff creado exitosamente");
    expect(data.staff).toBeDefined();
  });

  it("returns 400 if email already exists", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify(validStaffData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ya existe un usuario con este email");
  });

  it("returns 400 if name is too short", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify({ ...validStaffData, name: "A" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if email is invalid", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify({ ...validStaffData, email: "invalid-email" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if password is too short", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify({ ...validStaffData, password: "12345" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/staff", {
      method: "POST",
      body: JSON.stringify(validStaffData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
