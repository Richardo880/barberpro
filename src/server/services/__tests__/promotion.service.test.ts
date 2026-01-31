import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isPromoDayForDate,
  calculatePrice,
  calculatePriceWithPromotion,
  getPromotionConfig,
  PromotionConfig,
} from "../promotion.service";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appConfig: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("promotion.service", () => {
  const mockConfig: PromotionConfig = {
    enabled: true,
    day: 3, // Wednesday
    discount: 10000,
    message: "Promo Wednesday!",
    serviceIds: ["service-1", "service-2"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isPromoDayForDate", () => {
    it("returns true when date matches promo day and promo is enabled", () => {
      // Wednesday, January 1, 2025
      const wednesday = new Date("2025-01-01T10:00:00");
      expect(isPromoDayForDate(mockConfig, wednesday)).toBe(true);
    });

    it("returns false when date does not match promo day", () => {
      // Thursday, January 2, 2025
      const thursday = new Date("2025-01-02T10:00:00");
      expect(isPromoDayForDate(mockConfig, thursday)).toBe(false);
    });

    it("returns false when promo is disabled even on promo day", () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const wednesday = new Date("2025-01-01T10:00:00");
      expect(isPromoDayForDate(disabledConfig, wednesday)).toBe(false);
    });

    it("handles different promo days correctly", () => {
      const mondayConfig = { ...mockConfig, day: 1 }; // Monday
      const monday = new Date("2025-01-06T10:00:00"); // Monday, January 6, 2025
      expect(isPromoDayForDate(mondayConfig, monday)).toBe(true);
    });
  });

  describe("calculatePrice", () => {
    it("applies discount when promo day and service is eligible", () => {
      const wednesday = new Date("2025-01-01T10:00:00");
      const result = calculatePrice(50000, "service-1", wednesday, mockConfig);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 40000,
        discountAmount: 10000,
        promotionApplied: true,
      });
    });

    it("does not apply discount when service is not in promo list", () => {
      const wednesday = new Date("2025-01-01T10:00:00");
      const result = calculatePrice(50000, "service-not-in-promo", wednesday, mockConfig);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 50000,
        discountAmount: 0,
        promotionApplied: false,
      });
    });

    it("does not apply discount on non-promo day", () => {
      const thursday = new Date("2025-01-02T10:00:00");
      const result = calculatePrice(50000, "service-1", thursday, mockConfig);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 50000,
        discountAmount: 0,
        promotionApplied: false,
      });
    });

    it("does not apply discount when promo is disabled", () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const wednesday = new Date("2025-01-01T10:00:00");
      const result = calculatePrice(50000, "service-1", wednesday, disabledConfig);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 50000,
        discountAmount: 0,
        promotionApplied: false,
      });
    });

    it("caps discount at original price (no negative prices)", () => {
      const highDiscountConfig = { ...mockConfig, discount: 100000 };
      const wednesday = new Date("2025-01-01T10:00:00");
      const result = calculatePrice(50000, "service-1", wednesday, highDiscountConfig);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 0,
        discountAmount: 50000,
        promotionApplied: true,
      });
    });

    it("handles zero price service", () => {
      const wednesday = new Date("2025-01-01T10:00:00");
      const result = calculatePrice(0, "service-1", wednesday, mockConfig);

      expect(result).toEqual({
        originalPrice: 0,
        finalPrice: 0,
        discountAmount: 0,
        promotionApplied: true,
      });
    });
  });

  describe("getPromotionConfig", () => {
    it("returns config from database", async () => {
      vi.mocked(prisma.appConfig.findMany).mockResolvedValue([
        { id: "1", key: "promo_enabled", value: "true", createdAt: new Date(), updatedAt: new Date() },
        { id: "2", key: "promo_day", value: "3", createdAt: new Date(), updatedAt: new Date() },
        { id: "3", key: "promo_discount", value: "15000", createdAt: new Date(), updatedAt: new Date() },
        { id: "4", key: "promo_message", value: "Wednesday Special!", createdAt: new Date(), updatedAt: new Date() },
        { id: "5", key: "promo_service_ids", value: '["svc-1","svc-2"]', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const config = await getPromotionConfig();

      expect(config).toEqual({
        enabled: true,
        day: 3,
        discount: 15000,
        message: "Wednesday Special!",
        serviceIds: ["svc-1", "svc-2"],
      });
    });

    it("returns default values when config is missing", async () => {
      vi.mocked(prisma.appConfig.findMany).mockResolvedValue([]);

      const config = await getPromotionConfig();

      expect(config).toEqual({
        enabled: false,
        day: 3,
        discount: 10000,
        message: "¡Día de Promo! Cortes seleccionados con descuento",
        serviceIds: [],
      });
    });

    it("handles partial config", async () => {
      vi.mocked(prisma.appConfig.findMany).mockResolvedValue([
        { id: "1", key: "promo_enabled", value: "true", createdAt: new Date(), updatedAt: new Date() },
        { id: "2", key: "promo_day", value: "5", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const config = await getPromotionConfig();

      expect(config.enabled).toBe(true);
      expect(config.day).toBe(5);
      expect(config.discount).toBe(10000); // default
      expect(config.serviceIds).toEqual([]); // default
    });
  });

  describe("calculatePriceWithPromotion", () => {
    it("fetches config and calculates price", async () => {
      vi.mocked(prisma.appConfig.findMany).mockResolvedValue([
        { id: "1", key: "promo_enabled", value: "true", createdAt: new Date(), updatedAt: new Date() },
        { id: "2", key: "promo_day", value: "3", createdAt: new Date(), updatedAt: new Date() },
        { id: "3", key: "promo_discount", value: "10000", createdAt: new Date(), updatedAt: new Date() },
        { id: "5", key: "promo_service_ids", value: '["service-1"]', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const wednesday = new Date("2025-01-01T10:00:00");
      const result = await calculatePriceWithPromotion(50000, "service-1", wednesday);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 40000,
        discountAmount: 10000,
        promotionApplied: true,
      });
    });

    it("returns original price when no promo config exists", async () => {
      vi.mocked(prisma.appConfig.findMany).mockResolvedValue([]);

      const wednesday = new Date("2025-01-01T10:00:00");
      const result = await calculatePriceWithPromotion(50000, "service-1", wednesday);

      expect(result).toEqual({
        originalPrice: 50000,
        finalPrice: 50000,
        discountAmount: 0,
        promotionApplied: false,
      });
    });
  });
});
