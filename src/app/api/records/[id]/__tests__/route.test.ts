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
    haircutRecord: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("GET /api/records/[id]", () => {
  const mockRecord = {
    id: "clrxyz1234567890abcdef10",
    clientId: mockUser.id,
    serviceId: mockServices[0].id,
    staffId: mockStaff[0].id,
    date: new Date("2025-01-01T10:00:00Z"),
    price: 50000,
    originalPrice: 50000,
    discountAmount: 0,
    promotionApplied: false,
    notes: "Corte normal",
    tags: ["degradado"],
    photoUrls: [],
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      imageUrl: null,
    },
    staff: {
      id: mockStaff[0].id,
      name: mockStaff[0].name,
      email: mockStaff[0].email,
    },
    client: {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 404 if record is not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Record no encontrado");
  });

  it("returns 403 if client tries to access another client's record", async () => {
    const otherClientRecord = { ...mockRecord, clientId: "other-client-id" };
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(otherClientRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns record for client accessing own record", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.record).toBeDefined();
    expect(data.record.id).toBe(mockRecord.id);
  });

  it("returns record for admin accessing any record", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.record).toBeDefined();
  });

  it("returns record for staff accessing any record", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.record).toBeDefined();
  });

  it("includes service, staff, and client in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.record.service).toBeDefined();
    expect(data.record.staff).toBeDefined();
    expect(data.record.client).toBeDefined();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findUnique).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/records/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/records/[id]", () => {
  const mockRecord = {
    id: "clrxyz1234567890abcdef10",
    clientId: mockUser.id,
    serviceId: mockServices[0].id,
    staffId: mockStaff[0].id,
    date: new Date("2025-01-01T10:00:00Z"),
    price: 50000,
    notes: "Updated notes",
    tags: ["new-tag"],
    photoUrls: ["https://example.com/new-photo.jpg"],
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      imageUrl: null,
    },
    staff: {
      id: mockStaff[0].id,
      name: mockStaff[0].name,
      email: mockStaff[0].email,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to update record", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("updates notes successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.update).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated notes" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Record actualizado exitosamente");
    expect(prisma.haircutRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "123" },
        data: expect.objectContaining({ notes: "Updated notes" }),
      })
    );
  });

  it("updates tags successfully for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.haircutRecord.update).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ tags: ["degradado", "pompadour"] }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.haircutRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tags: ["degradado", "pompadour"] }),
      })
    );
  });

  it("updates photoUrls successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.update).mockResolvedValue(mockRecord as any);

    const photoUrls = ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"];
    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ photoUrls }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.haircutRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ photoUrls }),
      })
    );
  });

  it("updates multiple fields at once", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.update).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({
        notes: "New notes",
        tags: ["tag1"],
        photoUrls: ["https://example.com/photo.jpg"],
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.haircutRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: "New notes",
          tags: ["tag1"],
          photoUrls: ["https://example.com/photo.jpg"],
        }),
      })
    );
  });

  it("does not update fields not provided", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.update).mockResolvedValue(mockRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Only notes" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    const updateCall = vi.mocked(prisma.haircutRecord.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("tags");
    expect(updateCall.data).not.toHaveProperty("photoUrls");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.update).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("DELETE /api/records/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to delete record", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if staff tries to delete record", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("deletes record successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.delete).mockResolvedValue({} as any);

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Record eliminado exitosamente");
    expect(prisma.haircutRecord.delete).toHaveBeenCalledWith({
      where: { id: "123" },
    });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.delete).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/records/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
