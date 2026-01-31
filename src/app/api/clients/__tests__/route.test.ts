import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockUser, mockAdmin, mockStaff } from "@/test/mockData";

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
      count: vi.fn(),
    },
  },
}));

describe("GET /api/clients", () => {
  const mockClients = [
    {
      id: "clrxyz1234567890abcdef30",
      name: "Juan Pérez",
      email: "juan@test.com",
      phone: "+595991234567",
      birthDate: null,
      createdAt: new Date("2025-01-01"),
      clientProfile: {
        tags: ["vip"],
        preferredStaffId: null,
      },
      _count: {
        appointments: 5,
      },
      appointments: [
        {
          id: "apt-1",
          startTime: new Date("2025-01-15T10:00:00Z"),
          status: "COMPLETED",
        },
      ],
    },
    {
      id: "clrxyz1234567890abcdef31",
      name: "María García",
      email: "maria@test.com",
      phone: "+595997654321",
      birthDate: new Date("1990-05-15"),
      createdAt: new Date("2025-01-02"),
      clientProfile: {
        tags: [],
        preferredStaffId: mockStaff[0].id,
      },
      _count: {
        appointments: 2,
      },
      appointments: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to list clients", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns clients for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockClients as any);
    vi.mocked(prisma.user.count).mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clients).toHaveLength(2);
    expect(data.pagination).toBeDefined();
  });

  it("returns clients for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockClients as any);
    vi.mocked(prisma.user.count).mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("filters by role CLIENT", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/clients");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "CLIENT",
        }),
      })
    );
  });

  it("searches by name, email, or phone", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockClients[0]] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/clients?search=juan");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "juan", mode: "insensitive" } },
            { email: { contains: "juan", mode: "insensitive" } },
            { phone: { contains: "juan", mode: "insensitive" } },
          ],
        }),
      })
    );
  });

  it("supports pagination with page parameter", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(50);

    const request = new NextRequest("http://localhost:3000/api/clients?page=2&limit=10");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
      })
    );
  });

  it("returns pagination info", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockClients as any);
    vi.mocked(prisma.user.count).mockResolvedValue(50);

    const request = new NextRequest("http://localhost:3000/api/clients?page=1&limit=20");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    });
  });

  it("uses default pagination values", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
  });

  it("orders clients by createdAt descending", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/clients");
    await GET(request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("includes clientProfile and appointments count", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockClients as any);
    vi.mocked(prisma.user.count).mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(data.clients[0].clientProfile).toBeDefined();
    expect(data.clients[0]._count.appointments).toBe(5);
  });

  it("includes last appointment info", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockClients as any);
    vi.mocked(prisma.user.count).mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(data.clients[0].appointments).toHaveLength(1);
    expect(data.clients[0].appointments[0].status).toBe("COMPLETED");
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/clients");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
