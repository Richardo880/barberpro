import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockUser, mockAdmin, mockServices, mockStaff } from "@/test/mockData";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    service: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("GET /api/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active services by default (no auth required)", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue(mockServices as any);

    const request = new NextRequest("http://localhost:3000/api/services");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.services).toBeDefined();
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      })
    );
  });

  it("returns all services when active=false", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue(mockServices as any);

    const request = new NextRequest("http://localhost:3000/api/services?active=false");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      })
    );
  });

  it("orders services by name ascending", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue(mockServices as any);

    const request = new NextRequest("http://localhost:3000/api/services");
    await GET(request);

    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("selects only required fields", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue(mockServices as any);

    const request = new NextRequest("http://localhost:3000/api/services");
    await GET(request);

    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          imageUrl: true,
          isActive: true,
        },
      })
    );
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.service.findMany).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/services");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("POST /api/services", () => {
  const validServiceData = {
    name: "Corte Premium",
    description: "Corte con estilo premium",
    duration: 45,
    price: 75000,
    isActive: true,
  };

  const createdService = {
    id: "clrxyz1234567890abcdef20",
    ...validServiceData,
    imageUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(validServiceData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to create service", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(validServiceData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("creates service successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.create).mockResolvedValue(createdService as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(validServiceData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Servicio creado exitosamente");
    expect(data.service).toBeDefined();
  });

  it("creates service successfully for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.service.create).mockResolvedValue(createdService as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(validServiceData),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("returns 400 if name is too short", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ ...validServiceData, name: "AB" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if duration is less than 5 minutes", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ ...validServiceData, duration: 3 }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if price is negative", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ ...validServiceData, price: -100 }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if imageUrl is invalid URL", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ ...validServiceData, imageUrl: "not-a-url" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("accepts empty string for imageUrl", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.create).mockResolvedValue(createdService as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ ...validServiceData, imageUrl: "" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("accepts valid imageUrl", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.create).mockResolvedValue({
      ...createdService,
      imageUrl: "https://example.com/image.jpg",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({
        ...validServiceData,
        imageUrl: "https://example.com/image.jpg",
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("sets isActive to true by default", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.create).mockResolvedValue(createdService as any);

    const { isActive, ...dataWithoutIsActive } = validServiceData;
    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(dataWithoutIsActive),
    });
    await POST(request);

    expect(prisma.service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isActive: true,
      }),
    });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.create).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify(validServiceData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
