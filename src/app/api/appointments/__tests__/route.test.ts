import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockUser, mockAdmin, mockAppointment, mockServices } from "@/test/mockData";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
  },
}));

describe("GET /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/appointments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns appointments for authenticated user", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([mockAppointment]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(1);

    const request = new NextRequest("http://localhost:3000/api/appointments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointments).toHaveLength(1);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("filters appointments by clientId for CLIENT role", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);

    const request = new NextRequest("http://localhost:3000/api/appointments");
    await GET(request);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: mockUser.id,
        }),
      })
    );
  });

  it("does not filter by clientId for ADMIN role", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockAdmin,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);

    const request = new NextRequest("http://localhost:3000/api/appointments");
    await GET(request);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          clientId: expect.anything(),
        }),
      })
    );
  });

  it("filters appointments by status", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost:3000/api/appointments?status=PENDING"
    );
    await GET(request);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
        }),
      })
    );
  });

  it("filters appointments by date range", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);

    const fromDate = "2024-01-01T00:00:00.000Z";
    const toDate = "2024-12-31T23:59:59.999Z";
    const request = new NextRequest(
      `http://localhost:3000/api/appointments?from=${fromDate}&to=${toDate}`
    );
    await GET(request);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startTime: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }),
      })
    );
  });

  it("handles pagination correctly", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost:3000/api/appointments?page=2&limit=5"
    );
    await GET(request);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });

  it("returns 400 for invalid query parameters", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/api/appointments?page=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Parámetros inválidos");
  });
});

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "service-1",
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("creates appointment successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.service.findUnique).mockResolvedValueOnce({
      ...mockServices[0],
      isActive: true,
    });

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]); // No conflicts
    vi.mocked(prisma.appointment.create).mockResolvedValueOnce(mockAppointment as any);

    const appointmentData = {
      serviceId: mockServices[0].id,
      staffId: "staff-1",
      startTime: new Date(Date.now() + 86400000).toISOString(),
      clientNotes: "Test notes",
    };

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Turno reservado exitosamente");
    expect(data.appointment).toBeDefined();
  });

  it("returns 404 if service is not found", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.service.findUnique).mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "invalid-service",
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Servicio no encontrado o inactivo");
  });

  it("returns 409 if time slot is not available", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.service.findUnique).mockResolvedValueOnce({
      ...mockServices[0],
      isActive: true,
    });

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([
      mockAppointment as any,
    ]); // Conflict found

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: mockServices[0].id,
        startTime: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("El horario seleccionado no está disponible");
  });

  it("returns 400 for invalid request body", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "service-1",
        // Missing required startTime
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("creates appointment without optional staffId", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: mockUser,
    } as any);

    vi.mocked(prisma.service.findUnique).mockResolvedValueOnce({
      ...mockServices[0],
      isActive: true,
    });

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.create).mockResolvedValueOnce({
      ...mockAppointment,
      staffId: null,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: mockServices[0].id,
        startTime: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          staffId: null,
        }),
      })
    );
  });
});
