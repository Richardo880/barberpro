import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockUser, mockAdmin, mockStaff, mockServices } from "@/test/mockData";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    clientProfile: {
      update: vi.fn(),
    },
  },
}));

describe("GET /api/clients/[id]", () => {
  const mockClient = {
    id: mockUser.id,
    name: "Juan Pérez",
    email: "juan@test.com",
    phone: "+595991234567",
    birthDate: null,
    createdAt: new Date("2025-01-01"),
    clientProfile: {
      internalNotes: "Cliente frecuente",
      tags: ["vip"],
      preferredStaffId: mockStaff[0].id,
    },
    appointments: [
      {
        id: "apt-1",
        startTime: new Date("2025-01-15T10:00:00Z"),
        endTime: new Date("2025-01-15T10:30:00Z"),
        status: "COMPLETED",
        service: {
          id: mockServices[0].id,
          name: mockServices[0].name,
          price: 50000,
        },
        staff: {
          id: mockStaff[0].id,
          name: mockStaff[0].name,
        },
      },
    ],
    records: [
      {
        id: "rec-1",
        date: new Date("2025-01-15"),
        price: 50000,
        tags: ["degradado"],
        service: {
          id: mockServices[0].id,
          name: mockServices[0].name,
        },
        staff: {
          id: mockStaff[0].id,
          name: mockStaff[0].name,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to access another client", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/clients/other-client-id");
    const response = await GET(request, { params: Promise.resolve({ id: "other-client-id" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns client for client accessing own profile", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest(`http://localhost:3000/api/clients/${mockUser.id}`);
    const response = await GET(request, { params: Promise.resolve({ id: mockUser.id }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.client).toBeDefined();
    expect(data.client.id).toBe(mockUser.id);
  });

  it("returns client for admin accessing any client", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/any-client-id");
    const response = await GET(request, { params: Promise.resolve({ id: "any-client-id" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.client).toBeDefined();
  });

  it("returns client for staff accessing any client", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/any-client-id");
    const response = await GET(request, { params: Promise.resolve({ id: "any-client-id" }) });

    expect(response.status).toBe(200);
  });

  it("returns 404 if client not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/clients/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Cliente no encontrado");
  });

  it("filters by role CLIENT when finding user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    await GET(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "123", role: "CLIENT" },
      })
    );
  });

  it("includes clientProfile in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.client.clientProfile).toBeDefined();
    expect(data.client.clientProfile.internalNotes).toBe("Cliente frecuente");
    expect(data.client.clientProfile.tags).toContain("vip");
  });

  it("includes appointments in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.client.appointments).toBeDefined();
    expect(data.client.appointments).toHaveLength(1);
    expect(data.client.appointments[0].service).toBeDefined();
    expect(data.client.appointments[0].staff).toBeDefined();
  });

  it("includes records in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockClient as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.client.records).toBeDefined();
    expect(data.client.records).toHaveLength(1);
    expect(data.client.records[0].service).toBeDefined();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/clients/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/clients/[id]", () => {
  const mockClientProfile = {
    id: "profile-1",
    userId: mockUser.id,
    internalNotes: "Updated notes",
    tags: ["vip", "frequent"],
    preferredStaffId: mockStaff[0].id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to update profile", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 404 if client not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/clients/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Cliente no encontrado");
  });

  it("updates internalNotes successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Updated notes" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Perfil del cliente actualizado exitosamente");
    expect(prisma.clientProfile.update).toHaveBeenCalledWith({
      where: { userId: "123" },
      data: { internalNotes: "Updated notes" },
    });
  });

  it("updates tags successfully for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ tags: ["vip", "frequent"] }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.clientProfile.update).toHaveBeenCalledWith({
      where: { userId: "123" },
      data: { tags: ["vip", "frequent"] },
    });
  });

  it("updates preferredStaffId successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ preferredStaffId: mockStaff[0].id }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.clientProfile.update).toHaveBeenCalledWith({
      where: { userId: "123" },
      data: { preferredStaffId: mockStaff[0].id },
    });
  });

  it("updates multiple fields at once", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({
        internalNotes: "VIP client",
        tags: ["vip"],
        preferredStaffId: mockStaff[0].id,
      }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(200);
    expect(prisma.clientProfile.update).toHaveBeenCalledWith({
      where: { userId: "123" },
      data: {
        internalNotes: "VIP client",
        tags: ["vip"],
        preferredStaffId: mockStaff[0].id,
      },
    });
  });

  it("does not update fields not provided", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Only notes" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    const updateCall = vi.mocked(prisma.clientProfile.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("tags");
    expect(updateCall.data).not.toHaveProperty("preferredStaffId");
  });

  it("verifies client exists with role CLIENT", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "123", role: "CLIENT" },
      select: { id: true },
    });
  });

  it("returns clientProfile in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockResolvedValue(mockClientProfile as any);

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.clientProfile).toBeDefined();
    expect(data.clientProfile.internalNotes).toBe("Updated notes");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUser.id } as any);
    vi.mocked(prisma.clientProfile.update).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/clients/123", {
      method: "PATCH",
      body: JSON.stringify({ internalNotes: "Test" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
