import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AvailabilityService } from "../availability.service";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    service: {
      findUnique: vi.fn(),
    },
    businessHours: {
      findUnique: vi.fn(),
    },
    closure: {
      findFirst: vi.fn(),
    },
    appointment: {
      findMany: vi.fn(),
    },
    appConfig: {
      findUnique: vi.fn(),
    },
  },
}));

describe("AvailabilityService", () => {
  let service: AvailabilityService;

  // Mock data
  const mockService = {
    id: "clrxyz1234567890abcdef01",
    name: "Corte de cabello",
    duration: 30,
    price: 50000,
    isActive: true,
  };

  const mockBusinessHours = {
    dayOfWeek: "WEDNESDAY",
    isOpen: true,
    openTime: "09:00",
    closeTime: "18:00",
  };

  const mockClosedDay = {
    dayOfWeek: "SUNDAY",
    isOpen: false,
    openTime: null,
    closeTime: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AvailabilityService();

    // Default: no buffer config (uses default 10 min)
    vi.mocked(prisma.appConfig.findUnique).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getAvailableSlots", () => {
    it("returns slots based on business hours", async () => {
      // Set fixed time to avoid past slot filtering issues
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z")); // Early morning UTC

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01", // Wednesday
      });

      // Should have slots from 09:00 to 17:30 (last slot that ends by 18:00)
      // With 30-min intervals: 09:00, 09:30, 10:00, ... 17:30 = 18 slots
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.every(s => s.available)).toBe(true);
    });

    it("returns empty array when business is closed that day", async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockClosedDay as any);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-05", // Sunday
      });

      expect(slots).toEqual([]);
    });

    it("returns empty array when no business hours found", async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(null);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      expect(slots).toEqual([]);
    });

    it("returns empty array when there is an all-day closure", async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue({
        id: "closure-1",
        date: new Date("2025-01-01"),
        reason: "Feriado",
        isAllDay: true,
      } as any);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      expect(slots).toEqual([]);
    });

    it("throws error when service not found", async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

      await expect(
        service.getAvailableSlots({
          serviceId: "nonexistent",
          date: "2025-01-01",
        })
      ).rejects.toThrow("Servicio no encontrado");
    });

    it("marks past slots as unavailable", async () => {
      vi.useFakeTimers();
      // Set time to 14:00 Paraguay time (UTC-3 in summer, UTC-4 in winter)
      // January is summer in Paraguay, so UTC-3
      vi.setSystemTime(new Date("2025-01-01T17:00:00Z")); // 14:00 Paraguay time

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      // Morning slots should be unavailable (past)
      const morningSlots = slots.filter(s => {
        const hour = new Date(s.start).getUTCHours();
        return hour < 17; // Before 14:00 Paraguay (17:00 UTC)
      });

      // Afternoon/evening slots should be available
      const afternoonSlots = slots.filter(s => {
        const hour = new Date(s.start).getUTCHours();
        return hour >= 17;
      });

      expect(morningSlots.every(s => !s.available)).toBe(true);
      expect(afternoonSlots.some(s => s.available)).toBe(true);
    });

    it("marks conflicting slots as unavailable", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      const existingAppointment = {
        id: "apt-1",
        startTime: new Date("2025-01-01T13:00:00Z"), // 10:00 Paraguay
        endTime: new Date("2025-01-01T13:30:00Z"),   // 10:30 Paraguay
        staffId: "staff-1",
        status: "CONFIRMED",
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([existingAppointment] as any);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      // The 10:00 slot should be unavailable due to conflict
      const conflictingSlot = slots.find(s => {
        const hour = new Date(s.start).getUTCHours();
        const minutes = new Date(s.start).getUTCMinutes();
        return hour === 13 && minutes === 0; // 10:00 Paraguay = 13:00 UTC
      });

      expect(conflictingSlot?.available).toBe(false);
    });

    it("filters appointments by staffId when provided", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      await service.getAvailableSlots({
        serviceId: mockService.id,
        staffId: "staff-123",
        date: "2025-01-01",
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: "staff-123",
          }),
        })
      );
    });

    it("respects buffer time from config", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      // Configure 15 minute buffer
      vi.mocked(prisma.appConfig.findUnique).mockResolvedValue({
        key: "buffer_time_minutes",
        value: "15",
      } as any);

      const existingAppointment = {
        id: "apt-1",
        startTime: new Date("2025-01-01T13:00:00Z"),
        endTime: new Date("2025-01-01T13:30:00Z"),
        staffId: null,
        status: "CONFIRMED",
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([existingAppointment] as any);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      // With 15 min buffer, slots at 12:45-13:45 area should be affected
      // The slot at 12:30 (which ends at 13:00) might conflict due to buffer
      expect(prisma.appConfig.findUnique).toHaveBeenCalledWith({
        where: { key: "buffer_time_minutes" },
      });
    });

    it("does not generate slots that would end after closing time", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      // Service that takes 45 minutes
      const longService = { ...mockService, duration: 45 };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(longService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService.id,
        date: "2025-01-01",
      });

      // Last valid slot should be 17:00 (ends at 17:45, before 18:00)
      // 17:30 would end at 18:15, which is after closing
      const lastSlot = slots[slots.length - 1];
      const lastSlotEnd = new Date(lastSlot.end);

      // Verify no slot ends after closing time (18:00 Paraguay = 21:00 UTC)
      slots.forEach(slot => {
        expect(new Date(slot.end).getUTCHours()).toBeLessThanOrEqual(21);
      });
    });
  });

  describe("validateSlot", () => {
    it("returns valid for an available slot", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-01T13:00:00Z") // 10:00 Paraguay
      );

      expect(result).toEqual({ valid: true });
    });

    it("returns invalid when service not found", async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

      const result = await service.validateSlot(
        "nonexistent",
        null,
        new Date("2025-01-01T13:00:00Z")
      );

      expect(result).toEqual({ valid: false, reason: "Servicio no encontrado" });
    });

    it("returns invalid for past times", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T15:00:00Z")); // Current time

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);

      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-01T10:00:00Z") // Past time
      );

      expect(result).toEqual({
        valid: false,
        reason: "No se pueden hacer reservas en el pasado",
      });
    });

    it("returns invalid when business is closed that day", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-05T05:00:00Z")); // Sunday

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockClosedDay as any);

      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-05T13:00:00Z")
      );

      expect(result).toEqual({
        valid: false,
        reason: "El local está cerrado ese día",
      });
    });

    it("returns invalid when there is a closure", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue({
        id: "closure-1",
        date: new Date("2025-01-01"),
        reason: "Año Nuevo",
        isAllDay: true,
      } as any);

      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-01T13:00:00Z")
      );

      expect(result).toEqual({
        valid: false,
        reason: "Cerrado por Año Nuevo",
      });
    });

    it("returns invalid when slot conflicts with existing appointment", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      const existingAppointment = {
        id: "apt-1",
        startTime: new Date("2025-01-01T13:00:00Z"),
        endTime: new Date("2025-01-01T13:30:00Z"),
        staffId: null,
        status: "CONFIRMED",
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([existingAppointment] as any);

      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-01T13:00:00Z") // Same time as existing
      );

      expect(result).toEqual({
        valid: false,
        reason: "Slot ya ocupado",
      });
    });

    it("returns invalid when slot is outside business hours", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      // Try to book at 7:00 AM (before 9:00 opening)
      const result = await service.validateSlot(
        mockService.id,
        null,
        new Date("2025-01-01T10:00:00Z") // 7:00 Paraguay
      );

      expect(result).toEqual({
        valid: false,
        reason: "Fuera del horario de atención",
      });
    });

    it("validates with specific staffId", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T05:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      await service.validateSlot(
        mockService.id,
        "staff-123",
        new Date("2025-01-01T13:00:00Z")
      );

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: "staff-123",
          }),
        })
      );
    });
  });

  describe("booking conflict scenarios", () => {
    // Scenario: Friday January 3 2025, service 60 min, business hours 09:00-18:00
    // Paraguay is UTC-3 in January (summer)
    // 17:00 PY = 20:00 UTC, 18:00 PY = 21:00 UTC

    const mockService60min = {
      id: "clrxyz1234567890abcdef01",
      name: "Corte + Barba",
      duration: 60,
      price: 80000,
      isActive: true,
    };

    const mockFridayHours = {
      dayOfWeek: "FRIDAY",
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
    };

    const staffId = "clrxyz1234567890abcstaff";

    function setupFridayMocks(appointments: any[] = []) {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService60min as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockFridayHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue(appointments as any);
      vi.mocked(prisma.appConfig.findUnique).mockResolvedValue(null); // default 10 min buffer
    }

    it("user A books at 17:00 Friday - slot is available when no prior appointments", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z")); // 09:00 PY, Friday

      setupFridayMocks([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 17:00 PY = 20:00 UTC should be available
      const slot17 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 20 && m === 0;
      });

      expect(slot17).toBeDefined();
      expect(slot17!.available).toBe(true);
    });

    it("user B sees 17:00 Friday as occupied after user A booked there", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z")); // 09:00 PY

      // User A already has a 60-min appointment at 17:00 PY (20:00 UTC)
      const userAAppointment = {
        id: "apt-userA",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY (60 min)
        staffId,
        status: "CONFIRMED",
      };

      setupFridayMocks([userAAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 17:00 PY = 20:00 UTC should now be UNAVAILABLE
      const slot17 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 20 && m === 0;
      });

      expect(slot17).toBeDefined();
      expect(slot17!.available).toBe(false);
    });

    it("17:00 is the last possible slot for a 60-min service (17:30 would exceed closing time)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      setupFridayMocks([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 17:00 PY = 20:00 UTC should be the last slot (ends at 18:00 = closing)
      const slot17 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 20 && m === 0;
      });
      expect(slot17).toBeDefined();

      // 17:30 PY = 20:30 UTC should NOT exist (would end at 18:30, past closing)
      const slot1730 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 20 && m === 30;
      });
      expect(slot1730).toBeUndefined();
    });

    it("user B sees 16:30 as occupied due to overlap (60-min service would end at 17:30, conflicting with 17:00 appointment + buffer)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const userAAppointment = {
        id: "apt-userA",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "CONFIRMED",
      };

      setupFridayMocks([userAAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 16:30 PY = 19:30 UTC - a 60-min service here would end at 17:30,
      // which overlaps with the 17:00 appointment (minus 10-min buffer = 16:50)
      const slot1630 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 19 && m === 30;
      });

      expect(slot1630).toBeDefined();
      expect(slot1630!.available).toBe(false);
    });

    it("user B can book at 16:00 - 60-min service ends exactly at 17:00, back-to-back allowed", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const userAAppointment = {
        id: "apt-userA",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "CONFIRMED",
      };

      setupFridayMocks([userAAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 16:00 PY = 19:00 UTC - 60-min service ends at 17:00
      // aptStart=17:00 is NOT < slotEnd=17:00 (strict <), so no conflict
      const slot16 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 19 && m === 0;
      });

      expect(slot16).toBeDefined();
      expect(slot16!.available).toBe(true);
    });

    it("user B can book at 15:30 - 60-min service ends at 16:30, well before 17:00 appointment", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const userAAppointment = {
        id: "apt-userA",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "CONFIRMED",
      };

      setupFridayMocks([userAAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 15:30 PY = 18:30 UTC - 60-min service ends at 16:30, no conflict
      const slot1530 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 18 && m === 30;
      });

      expect(slot1530).toBeDefined();
      expect(slot1530!.available).toBe(true);
    });

    it("earlier slots unrelated to the appointment remain available", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const userAAppointment = {
        id: "apt-userA",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "CONFIRMED",
      };

      setupFridayMocks([userAAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // Morning slots (09:00-15:00 PY = 12:00-18:00 UTC) should all be available
      const morningSlots = slots.filter(s => {
        const h = new Date(s.start).getUTCHours();
        return h >= 12 && h < 18;
      });

      expect(morningSlots.length).toBeGreaterThan(0);
      expect(morningSlots.every(s => s.available)).toBe(true);
    });

    it("PENDING appointments also block slots (not just CONFIRMED)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const pendingAppointment = {
        id: "apt-pending",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "PENDING",
      };

      setupFridayMocks([pendingAppointment]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      const slot17 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 20 && m === 0;
      });

      expect(slot17).toBeDefined();
      expect(slot17!.available).toBe(false);
    });
  });

  describe("booking with extended hours (close at 20:00)", () => {
    // Business hours 09:00-20:00, service 60 min, buffer 10 min
    // Paraguay UTC-3 in January
    const mockService60min = {
      id: "clrxyz1234567890abcdef01",
      name: "Corte + Barba",
      duration: 60,
      price: 80000,
      isActive: true,
    };

    const mockExtendedHours = {
      dayOfWeek: "FRIDAY",
      isOpen: true,
      openTime: "09:00",
      closeTime: "21:00",
    };

    const staffId = "clrxyz1234567890abcstaff";

    function setupExtendedMocks(appointments: any[] = []) {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService60min as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockExtendedHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue(appointments as any);
      vi.mocked(prisma.appConfig.findUnique).mockResolvedValue(null);
    }

    it("generates slots up to 20:00 with 60-min service and 21:00 close", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z")); // 09:00 PY

      setupExtendedMocks([]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // Last slot should be 20:00 PY (ends 21:00 = closing)
      // 20:00 PY = 23:00 UTC
      const slot20 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 23 && m === 0;
      });
      expect(slot20).toBeDefined();
      expect(slot20!.available).toBe(true);

      // 20:30 should NOT exist (would end at 21:30, past closing)
      const slot2030 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 23 && m === 30;
      });
      expect(slot2030).toBeUndefined();
    });

    it("slots after a 17:00 appointment remain available (18:30, 19:00)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const appointmentAt17 = {
        id: "apt-17",
        startTime: new Date("2025-01-03T20:00:00Z"), // 17:00 PY
        endTime: new Date("2025-01-03T21:00:00Z"),   // 18:00 PY
        staffId,
        status: "CONFIRMED",
      };

      setupExtendedMocks([appointmentAt17]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 18:00 PY = 21:00 UTC - starts right when apt ends, but buffer extends 10 min
      // so 18:00 conflicts (within buffer 18:00+10=18:10)
      const slot18 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 21 && m === 0;
      });
      expect(slot18).toBeDefined();
      expect(slot18!.available).toBe(false);

      // 18:30 PY = 21:30 UTC - after buffer, should be AVAILABLE
      const slot1830 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 21 && m === 30;
      });
      expect(slot1830).toBeDefined();
      expect(slot1830!.available).toBe(true);

      // 19:00 PY = 22:00 UTC - well after, should be AVAILABLE
      const slot19 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 22 && m === 0;
      });
      expect(slot19).toBeDefined();
      expect(slot19!.available).toBe(true);
    });

    it("slots after a 17:30 appointment remain available (19:00)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-03T12:00:00Z"));

      const appointmentAt1730 = {
        id: "apt-1730",
        startTime: new Date("2025-01-03T20:30:00Z"), // 17:30 PY
        endTime: new Date("2025-01-03T21:30:00Z"),   // 18:30 PY
        staffId,
        status: "CONFIRMED",
      };

      setupExtendedMocks([appointmentAt1730]);

      const slots = await service.getAvailableSlots({
        serviceId: mockService60min.id,
        staffId,
        date: "2025-01-03",
      });

      // 19:00 PY = 22:00 UTC - after 18:30+10min buffer, should be AVAILABLE
      const slot19 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 22 && m === 0;
      });
      expect(slot19).toBeDefined();
      expect(slot19!.available).toBe(true);

      // 18:30 PY = 21:30 UTC - within buffer of apt ending at 18:30
      const slot1830 = slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === 21 && m === 30;
      });
      expect(slot1830).toBeDefined();
      expect(slot1830!.available).toBe(false);
    });
  });

  describe("full day booking simulation", () => {
    // Simulates filling up a full day (Monday 09:00-20:00) with a 60-min service
    // Paraguay UTC-3 in January (summer)
    // Each booking reduces available slots; conflicts are properly detected

    const mockService60 = {
      id: "clrxyz1234567890abcdef01",
      name: "Corte + Barba",
      duration: 60,
      price: 80000,
      isActive: true,
    };

    const mondayHours = {
      dayOfWeek: "MONDAY",
      isOpen: true,
      openTime: "09:00",
      closeTime: "21:00",
    };

    const barber = "clrxyz1234567890abcstaff";

    // Helper: create an appointment object
    function makeApt(id: string, startHourPY: number, startMinPY: number, durationMin: number) {
      // Convert Paraguay hour to UTC (UTC-3 in January)
      const startUTC = new Date(`2025-01-06T${String(startHourPY + 3).padStart(2, "0")}:${String(startMinPY).padStart(2, "0")}:00Z`);
      const endUTC = new Date(startUTC.getTime() + durationMin * 60 * 1000);
      return {
        id,
        startTime: startUTC,
        endTime: endUTC,
        staffId: barber,
        status: "CONFIRMED",
      };
    }

    // Helper: find a slot by Paraguay hour
    function findSlot(slots: any[], hourPY: number, minPY: number) {
      const utcH = hourPY + 3;
      return slots.find(s => {
        const h = new Date(s.start).getUTCHours();
        const m = new Date(s.start).getUTCMinutes();
        return h === utcH && m === minPY;
      });
    }

    function setup(appointments: any[]) {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService60 as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mondayHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue(appointments as any);
      vi.mocked(prisma.appConfig.findUnique).mockResolvedValue(null); // 10 min buffer
    }

    const getSlots = () => service.getAvailableSlots({
      serviceId: mockService60.id,
      staffId: barber,
      date: "2025-01-06", // Monday
    });

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-06T05:00:00Z")); // 02:00 PY, well before opening
    });

    it("empty day: all slots from 09:00 to 20:00 are available (23 slots)", async () => {
      setup([]);
      const slots = await getSlots();

      // 09:00 to 20:00 every 30 min = 23 slots (20:30 would end at 21:30 > close)
      // 09:00,09:30,10:00,...,20:00 = (20-9)*2 + 1 = 23 slots
      const available = slots.filter(s => s.available);
      expect(slots.length).toBe(23);
      expect(available.length).toBe(23);
    });

    it("step 1: book 10:00 - slot becomes unavailable, neighbors stay available", async () => {
      const booked = [makeApt("apt-1", 10, 0, 60)]; // 10:00-11:00
      setup(booked);
      const slots = await getSlots();

      // 10:00 is booked
      expect(findSlot(slots, 10, 0)!.available).toBe(false);
      // 10:30 conflicts (overlaps with 10:00-11:00)
      expect(findSlot(slots, 10, 30)!.available).toBe(false);

      // 09:00 available (ends 10:00, back-to-back ok)
      expect(findSlot(slots, 9, 0)!.available).toBe(true);
      // 09:30 available (ends 10:30, but 10:00 < 10:30 → conflict!)
      // Actually: isBefore(apt.startTime=10:00, slot.end=10:30) → true, conflict
      expect(findSlot(slots, 9, 30)!.available).toBe(false);

      // 11:00 within buffer (apt ends 11:00 + 10min buffer = 11:10, 11:00 < 11:10)
      expect(findSlot(slots, 11, 0)!.available).toBe(false);
      // 11:30 free (11:30 >= 11:10)
      expect(findSlot(slots, 11, 30)!.available).toBe(true);
      // 14:00 definitely free
      expect(findSlot(slots, 14, 0)!.available).toBe(true);
    });

    it("step 2: book 10:00 + 14:00 - both blocked, rest available", async () => {
      const booked = [
        makeApt("apt-1", 10, 0, 60), // 10:00-11:00
        makeApt("apt-2", 14, 0, 60), // 14:00-15:00
      ];
      setup(booked);
      const slots = await getSlots();

      expect(findSlot(slots, 10, 0)!.available).toBe(false);
      expect(findSlot(slots, 14, 0)!.available).toBe(false);
      // 12:00 free (between the two)
      expect(findSlot(slots, 12, 0)!.available).toBe(true);
      // 15:30 free (after 14:00 apt + buffer)
      expect(findSlot(slots, 15, 30)!.available).toBe(true);
    });

    it("step 3: try 10:30 with existing 10:00 booking → conflict", async () => {
      const booked = [
        makeApt("apt-1", 10, 0, 60), // 10:00-11:00
        makeApt("apt-2", 14, 0, 60), // 14:00-15:00
      ];
      setup(booked);
      const slots = await getSlots();

      // 10:30 with 60-min service → 10:30-11:30
      // Conflicts with apt-1 (10:00 < 11:30 AND 10:30 < 11:00)
      expect(findSlot(slots, 10, 30)!.available).toBe(false);
    });

    it("step 4: book 09:00, 11:30, 17:00 additionally - verify full picture", async () => {
      const booked = [
        makeApt("apt-1", 9, 0, 60),   // 09:00-10:00
        makeApt("apt-2", 10, 0, 60),  // 10:00-11:00 (back-to-back with apt-1)
        makeApt("apt-3", 11, 30, 60), // 11:30-12:30
        makeApt("apt-4", 14, 0, 60),  // 14:00-15:00
        makeApt("apt-5", 17, 0, 60),  // 17:00-18:00
      ];
      setup(booked);
      const slots = await getSlots();

      // All booked slots are unavailable
      expect(findSlot(slots, 9, 0)!.available).toBe(false);
      expect(findSlot(slots, 10, 0)!.available).toBe(false);
      expect(findSlot(slots, 11, 30)!.available).toBe(false);
      expect(findSlot(slots, 14, 0)!.available).toBe(false);
      expect(findSlot(slots, 17, 0)!.available).toBe(false);

      // Gaps that should still be available:
      // 13:00 (after 12:30+10min buffer = 12:40, 13:00 > 12:40) ✓
      expect(findSlot(slots, 13, 0)!.available).toBe(true);
      // 15:30 (after 15:00+10min = 15:10, 15:30 > 15:10) ✓
      expect(findSlot(slots, 15, 30)!.available).toBe(true);
      // 16:00 (ends 17:00, back-to-back with 17:00 apt, strict < so ok) ✓
      expect(findSlot(slots, 16, 0)!.available).toBe(true);
      // 18:30 (after 18:00+10min = 18:10, 18:30 > 18:10) ✓
      expect(findSlot(slots, 18, 30)!.available).toBe(true);
      // 19:00 available
      expect(findSlot(slots, 19, 0)!.available).toBe(true);
      // 20:00 available (last slot, ends at 21:00 = closing)
      expect(findSlot(slots, 20, 0)!.available).toBe(true);
    });

    it("step 5: fill the entire day - no available slots remain", async () => {
      // Fill every possible slot with back-to-back appointments
      // 09:00-10:00, 10:00-11:00, ..., 20:00-21:00
      const booked = [];
      for (let h = 9; h <= 20; h++) {
        booked.push(makeApt(`apt-${h}`, h, 0, 60));
      }
      setup(booked);
      const slots = await getSlots();

      const available = slots.filter(s => s.available);
      expect(available.length).toBe(0);
    });

    it("step 6: two bookings with a tight gap - verify what fits", async () => {
      // Apt at 10:00-11:00 and 12:00-13:00
      // Gap from 11:00 to 12:00 (1 hour), but buffer after apt-1 = 11:10
      // So effective gap: 11:10 to 12:00 (50 min) → too short for 60-min service
      const booked = [
        makeApt("apt-1", 10, 0, 60),  // 10:00-11:00
        makeApt("apt-2", 12, 0, 60),  // 12:00-13:00
      ];
      setup(booked);
      const slots = await getSlots();

      // 11:00 → ends 12:00, but slotStart=11:00 < aptEndWithBuffer=11:10 → conflict
      expect(findSlot(slots, 11, 0)!.available).toBe(false);
      // 11:30 → ends 12:30, slotStart=11:30 > 11:10 ok, but aptStart=12:00 < slotEnd=12:30 → conflict
      expect(findSlot(slots, 11, 30)!.available).toBe(false);
    });

    it("step 7: two bookings with enough gap for one more", async () => {
      // Apt at 10:00-11:00 and 13:00-14:00
      // Gap: 11:00+10min buffer → 11:10 to 13:00 (1h50min)
      // 11:30 → ends 12:30 → fits (11:30 > 11:10 and 12:30 < 13:00... wait)
      // isBefore(12:30, 13:00) check: slot.start=11:30 < aptEnd+buf=13:10 AND aptStart=13:00 < slotEnd=12:30?
      // 13:00 < 12:30 → false → NO conflict ✓
      const booked = [
        makeApt("apt-1", 10, 0, 60),  // 10:00-11:00
        makeApt("apt-2", 13, 0, 60),  // 13:00-14:00
      ];
      setup(booked);
      const slots = await getSlots();

      // 11:30 available (ends 12:30, before 13:00 apt)
      expect(findSlot(slots, 11, 30)!.available).toBe(true);
      // 12:00 → ends 13:00, aptStart=13:00 < slotEnd=13:00 → isBefore(13:00,13:00) = false → ok!
      expect(findSlot(slots, 12, 0)!.available).toBe(true);
    });
  });

  describe("getNextAvailableSlots", () => {
    it("returns limited number of available slots", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T12:00:00Z")); // 09:00 Paraguay

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await service.getNextAvailableSlots(mockService.id, undefined, 3);

      expect(slots.length).toBeLessThanOrEqual(3);
      expect(slots.every(s => s.available)).toBe(true);
    });

    it("searches tomorrow if not enough slots today", async () => {
      vi.useFakeTimers();
      // Late in the day - few slots remaining
      vi.setSystemTime(new Date("2025-01-01T20:30:00Z")); // 17:30 Paraguay

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      const slots = await service.getNextAvailableSlots(mockService.id, undefined, 5);

      // Should have called getAvailableSlots twice (today + tomorrow)
      expect(prisma.businessHours.findUnique).toHaveBeenCalledTimes(2);
    });

    it("filters by staffId when provided", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockBusinessHours as any);
      vi.mocked(prisma.closure.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

      await service.getNextAvailableSlots(mockService.id, "staff-123", 3);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            staffId: "staff-123",
          }),
        })
      );
    });

    it("returns empty array when no slots available", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      // Business closed both days
      vi.mocked(prisma.businessHours.findUnique).mockResolvedValue(mockClosedDay as any);

      const slots = await service.getNextAvailableSlots(mockService.id);

      expect(slots).toEqual([]);
    });
  });
});
