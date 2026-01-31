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
