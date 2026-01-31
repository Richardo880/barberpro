import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockAdmin, mockUser, mockServices, mockStaff } from "@/test/mockData";
import * as promotionService from "@/server/services/promotion.service";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    haircutRecord: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/services/promotion.service", () => ({
  calculatePriceWithPromotion: vi.fn(),
}));

describe("PATCH /api/appointments/[id] - Promotion Discount", () => {
  const mockAppointmentPending = {
    id: "clrxyz1234567890abcdef07",
    clientId: mockUser.id,
    serviceId: mockServices[0].id,
    staffId: mockStaff[0].id,
    startTime: new Date("2025-01-01T10:00:00"), // Wednesday - promo day
    endTime: new Date("2025-01-01T10:30:00"),
    status: "PENDING",
    clientNotes: "Corte degradado",
    staffNotes: null,
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      duration: 30,
      price: { toNumber: () => 50000 }, // Prisma Decimal mock
    },
  };

  const mockUpdatedAppointment = {
    ...mockAppointmentPending,
    status: "COMPLETED",
    staffNotes: "Corte completado",
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      duration: 30,
      price: 50000,
    },
    client: mockUser,
    staff: mockStaff[0],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates haircut record with discounted price when completing on promo day", async () => {
    // Setup session as admin
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    // Setup existing pending appointment
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointmentPending as any);

    // Setup updated appointment
    vi.mocked(prisma.appointment.update).mockResolvedValue(mockUpdatedAppointment as any);

    // Setup promotion calculation - promo applies
    vi.mocked(promotionService.calculatePriceWithPromotion).mockResolvedValue({
      originalPrice: 50000,
      finalPrice: 40000,
      discountAmount: 10000,
      promotionApplied: true,
    });

    // Setup record creation
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue({} as any);

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Turno actualizado exitosamente");

    // Verify promotion calculation was called with correct params
    expect(promotionService.calculatePriceWithPromotion).toHaveBeenCalledWith(
      50000, // original price
      mockServices[0].id, // serviceId
      mockUpdatedAppointment.startTime // date
    );

    // Verify haircut record was created with discounted price
    expect(prisma.haircutRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: mockUser.id,
        serviceId: mockServices[0].id,
        staffId: mockStaff[0].id,
        price: 40000, // discounted price
        originalPrice: 50000,
        discountAmount: 10000,
        promotionApplied: true,
      }),
    });
  });

  it("creates haircut record with original price when completing on non-promo day", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointmentPending as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue(mockUpdatedAppointment as any);

    // Setup promotion calculation - no promo
    vi.mocked(promotionService.calculatePriceWithPromotion).mockResolvedValue({
      originalPrice: 50000,
      finalPrice: 50000,
      discountAmount: 0,
      promotionApplied: false,
    });

    vi.mocked(prisma.haircutRecord.create).mockResolvedValue({} as any);

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });

    // Verify haircut record was created with original price
    expect(prisma.haircutRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        price: 50000, // original price
        originalPrice: 50000,
        discountAmount: 0,
        promotionApplied: false,
      }),
    });
  });

  it("does not create haircut record when status is not COMPLETED", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointmentPending as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue({
      ...mockUpdatedAppointment,
      status: "CONFIRMED",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });

    // Verify haircut record was NOT created
    expect(prisma.haircutRecord.create).not.toHaveBeenCalled();
    expect(promotionService.calculatePriceWithPromotion).not.toHaveBeenCalled();
  });

  it("does not create duplicate record when appointment is already COMPLETED", async () => {
    const alreadyCompletedAppointment = {
      ...mockAppointmentPending,
      status: "COMPLETED", // Already completed
    };

    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(alreadyCompletedAppointment as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue(mockUpdatedAppointment as any);

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED", staffNotes: "Updated notes" }),
    });

    await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });

    // Verify haircut record was NOT created (already completed)
    expect(prisma.haircutRecord.create).not.toHaveBeenCalled();
  });

  it("still updates appointment even if record creation fails", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointmentPending as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue(mockUpdatedAppointment as any);
    vi.mocked(promotionService.calculatePriceWithPromotion).mockResolvedValue({
      originalPrice: 50000,
      finalPrice: 40000,
      discountAmount: 10000,
      promotionApplied: true,
    });

    // Record creation fails
    vi.mocked(prisma.haircutRecord.create).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });

    // Appointment update should still succeed
    expect(response.status).toBe(200);
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/appointments/clrxyz1234567890abcdef07", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "clrxyz1234567890abcdef07" }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 404 if appointment does not exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/appointments/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Turno no encontrado");
  });
});
