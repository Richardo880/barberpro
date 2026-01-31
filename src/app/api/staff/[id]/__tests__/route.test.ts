import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "../route";
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
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    staffProfile: {
      update: vi.fn(),
    },
  },
}));

describe("GET /api/staff/[id]", () => {
  const mockStaffMember = {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns staff by id (no auth required)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.staff).toBeDefined();
    expect(data.staff.name).toBe(mockStaff[0].name);
  });

  it("returns 404 if staff not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/staff/nonexistent");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Miembro del staff no encontrado");
  });

  it("filters by role STAFF when finding", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123");
    await GET(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "123", role: "STAFF" },
      })
    );
  });

  it("flattens staff profile in response", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(data.staff.bio).toBe("Barbero profesional");
    expect(data.staff.specialties).toContain("cortes");
    expect(data.staff.services).toHaveLength(2);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/staff/123");
    const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("PATCH /api/staff/[id]", () => {
  const mockStaffMember = {
    id: mockStaff[0].id,
    name: mockStaff[0].name,
    email: mockStaff[0].email,
    phone: "+595991234567",
    staffProfile: {
      id: "profile-1",
      bio: "Barbero profesional",
      isActive: true,
    },
  };

  const updatedStaff = {
    ...mockStaffMember,
    name: "Updated Name",
    staffProfile: {
      ...mockStaffMember.staffProfile,
      bio: "Updated bio",
      services: mockServices,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 if not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if staff tries to update", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(403);
  });

  it("returns 404 if staff not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/staff/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Miembro del staff no encontrado");
  });

  it("updates staff successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedStaff as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name", bio: "Updated bio" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Staff actualizado exitosamente");
  });

  it("updates name successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedStaff as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New Name",
        }),
      })
    );
  });

  it("updates isActive successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedStaff as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          staffProfile: expect.objectContaining({
            update: expect.objectContaining({
              isActive: false,
            }),
          }),
        }),
      })
    );
  });

  it("returns 400 if name is too short", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "A" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.update).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("DELETE /api/staff/[id]", () => {
  const mockStaffMember = {
    id: mockStaff[0].id,
    name: mockStaff[0].name,
    staffAppointments: [],
  };

  const mockStaffWithAppointments = {
    ...mockStaffMember,
    staffAppointments: [{ id: "apt-1", status: "PENDING" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 if not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if staff tries to delete", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });

    expect(response.status).toBe(403);
  });

  it("returns 404 if staff not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/staff/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Miembro del staff no encontrado");
  });

  it("deletes staff when no pending appointments", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockStaffMember as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Staff eliminado exitosamente");
    expect(data.deleted).toBe(true);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "123" } });
  });

  it("deactivates instead of deleting when pending appointments exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffWithAppointments as any);
    vi.mocked(prisma.staffProfile.update).mockResolvedValue({} as any);

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("desactivado");
    expect(data.deactivated).toBe(true);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.staffProfile.update).toHaveBeenCalledWith({
      where: { userId: "123" },
      data: { isActive: false },
    });
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockStaffMember as any);
    vi.mocked(prisma.user.delete).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/staff/123", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
