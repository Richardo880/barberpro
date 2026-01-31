import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "../route";
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
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    appointment: {
      count: vi.fn(),
    },
  },
}));

describe("GET /api/services/[id]", () => {
  const mockService = {
    id: "clrxyz1234567890abcdef03",
    name: "Corte de cabello",
    description: "Corte tradicional",
    duration: 30,
    price: 50000,
    imageUrl: null,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns service by id (no auth required)", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.service).toBeDefined();
    expect(data.service.id).toBe(mockService.id);
  });

  it("returns 404 if service not found", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Servicio no encontrado");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.service.findUnique).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/services/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/services/[id]", () => {
  const mockService = {
    id: "clrxyz1234567890abcdef03",
    name: "Corte de cabello",
    description: "Corte tradicional",
    duration: 30,
    price: 50000,
    imageUrl: null,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nuevo nombre" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to update service", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nuevo nombre" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 404 if service not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nuevo nombre" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Servicio no encontrado");
  });

  it("updates service successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue({
      ...mockService,
      name: "Corte Premium",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Corte Premium" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Servicio actualizado exitosamente");
    expect(data.service.name).toBe("Corte Premium");
  });

  it("updates service successfully for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ price: 60000 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
  });

  it("updates name successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nuevo Nombre" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { name: "Nuevo Nombre" },
    });
  });

  it("updates price successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ price: 75000 }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { price: 75000 },
    });
  });

  it("updates duration successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ duration: 45 }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { duration: 45 },
    });
  });

  it("updates isActive successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { isActive: false },
    });
  });

  it("updates multiple fields at once", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Corte VIP",
        price: 100000,
        duration: 60,
      }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: {
        name: "Corte VIP",
        price: 100000,
        duration: 60,
      },
    });
  });

  it("returns 400 if name is too short", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "AB" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if duration is less than 5 minutes", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ duration: 3 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 if price is negative", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ price: -100 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.service.update).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nuevo nombre" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("DELETE /api/services/[id]", () => {
  const mockService = {
    id: "clrxyz1234567890abcdef03",
    name: "Corte de cabello",
    description: "Corte tradicional",
    duration: 30,
    price: 50000,
    imageUrl: null,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to delete service", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if staff tries to delete service", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 404 if service not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/services/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Servicio no encontrado");
  });

  it("deletes service successfully when no appointments exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.service.delete).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Servicio eliminado exitosamente");
    expect(prisma.service.delete).toHaveBeenCalledWith({ where: { id: "123" } });
  });

  it("deactivates instead of deleting when appointments exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(5);
    vi.mocked(prisma.service.update).mockResolvedValue({
      ...mockService,
      isActive: false,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("desactivado");
    expect(data.service.isActive).toBe(false);
    expect(prisma.service.delete).not.toHaveBeenCalled();
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { isActive: false },
    });
  });

  it("checks appointments count before deleting", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.service.delete).mockResolvedValue(mockService as any);

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    await DELETE(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.appointment.count).toHaveBeenCalledWith({
      where: { serviceId: "123" },
    });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.service.delete).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/services/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
