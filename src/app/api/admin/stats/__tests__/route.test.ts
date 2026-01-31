import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
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
    appointment: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  },
}));

describe("GET /api/admin/stats", () => {
  const mockUpcomingAppointments = [
    {
      id: "apt-1",
      startTime: new Date(),
      endTime: new Date(),
      status: "CONFIRMED",
      client: { id: "client-1", name: "Juan", phone: "+595991234567" },
      service: { id: mockServices[0].id, name: mockServices[0].name, duration: 30 },
      staff: { id: mockStaff[0].id, name: mockStaff[0].name },
    },
  ];

  const mockCompletedAppointments = [
    { service: { price: 50000 } },
    { service: { price: 75000 } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to access stats", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns stats for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count)
      .mockResolvedValueOnce(5)  // appointmentsToday
      .mockResolvedValueOnce(3); // appointmentsPending
    vi.mocked(prisma.appointment.findMany)
      .mockResolvedValueOnce(mockCompletedAppointments as any) // completedAppointmentsThisMonth
      .mockResolvedValueOnce(mockUpcomingAppointments as any); // upcomingToday
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(10)  // newClientsThisMonth
      .mockResolvedValueOnce(100); // totalClients

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toBeDefined();
    expect(data.upcomingToday).toBeDefined();
  });

  it("returns stats for staff", async () => {
    const staffUser = { ...mockStaff[0], role: "STAFF" as const };
    vi.mocked(getServerSession).mockResolvedValue({ user: staffUser } as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it("returns appointmentsToday count", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.appointmentsToday).toBe(5);
  });

  it("returns appointmentsPending count", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.appointmentsPending).toBe(3);
  });

  it("calculates monthlyRevenue from completed appointments", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.appointment.findMany)
      .mockResolvedValueOnce(mockCompletedAppointments as any)
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.monthlyRevenue).toBe(125000); // 50000 + 75000
  });

  it("returns newClientsThisMonth count", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(100);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.newClientsThisMonth).toBe(15);
  });

  it("returns totalClients count", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(100);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.stats.totalClients).toBe(100);
  });

  it("returns upcomingToday appointments", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    vi.mocked(prisma.appointment.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockUpcomingAppointments as any);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(data.upcomingToday).toHaveLength(1);
    expect(data.upcomingToday[0].client).toBeDefined();
    expect(data.upcomingToday[0].service).toBeDefined();
    expect(data.upcomingToday[0].staff).toBeDefined();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.count).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
