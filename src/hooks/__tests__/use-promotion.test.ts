import { describe, it, expect } from "vitest";
import {
  isPromoActive,
  isPromoDayForDate,
  getDiscountedPrice,
  PromotionConfig,
} from "../use-promotion";

const mockConfig: PromotionConfig = {
  enabled: true,
  day: 3, // Wednesday
  discount: 10000,
  message: "¡Miércoles de Promo!",
  serviceIds: ["service-1", "service-2"],
};

describe("isPromoDayForDate", () => {
  it("returns true when date matches promo day", () => {
    // Wednesday, January 1, 2025
    const wednesday = new Date("2025-01-01T12:00:00");
    expect(isPromoDayForDate(mockConfig, wednesday)).toBe(true);
  });

  it("returns false when date does not match promo day", () => {
    // Thursday, January 2, 2025
    const thursday = new Date("2025-01-02T12:00:00");
    expect(isPromoDayForDate(mockConfig, thursday)).toBe(false);
  });

  it("returns false when config is undefined", () => {
    const wednesday = new Date("2025-01-01T12:00:00");
    expect(isPromoDayForDate(undefined, wednesday)).toBe(false);
  });

  it("returns false when promo is disabled", () => {
    const disabledConfig = { ...mockConfig, enabled: false };
    const wednesday = new Date("2025-01-01T12:00:00");
    expect(isPromoDayForDate(disabledConfig, wednesday)).toBe(false);
  });
});

describe("getDiscountedPrice", () => {
  describe("without date parameter (uses today)", () => {
    it("returns original price when config is undefined", () => {
      const result = getDiscountedPrice(50000, "service-1", undefined);
      expect(result).toEqual({ finalPrice: 50000, hasDiscount: false });
    });

    it("returns original price when promo is disabled", () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const result = getDiscountedPrice(50000, "service-1", disabledConfig);
      expect(result).toEqual({ finalPrice: 50000, hasDiscount: false });
    });

    it("returns original price when service is not in promo list", () => {
      // Even if today were promo day, non-eligible service gets no discount
      const result = getDiscountedPrice(50000, "service-not-in-list", mockConfig);
      // hasDiscount depends on whether today is the promo day
      expect(result.finalPrice).toBe(50000);
    });
  });

  describe("with date parameter (bug fix verification)", () => {
    it("applies discount when date is a promo day and service is eligible", () => {
      const wednesday = new Date("2025-01-01T12:00:00");
      const result = getDiscountedPrice(50000, "service-1", mockConfig, wednesday);
      expect(result).toEqual({ finalPrice: 40000, hasDiscount: true });
    });

    it("does NOT apply discount when date is NOT a promo day", () => {
      const thursday = new Date("2025-01-02T12:00:00");
      const result = getDiscountedPrice(50000, "service-1", mockConfig, thursday);
      expect(result).toEqual({ finalPrice: 50000, hasDiscount: false });
    });

    it("does NOT apply discount when service is not in promo list even on promo day", () => {
      const wednesday = new Date("2025-01-01T12:00:00");
      const result = getDiscountedPrice(50000, "other-service", mockConfig, wednesday);
      expect(result).toEqual({ finalPrice: 50000, hasDiscount: false });
    });

    it("caps final price at 0 when discount exceeds price", () => {
      const bigDiscountConfig = { ...mockConfig, discount: 100000 };
      const wednesday = new Date("2025-01-01T12:00:00");
      const result = getDiscountedPrice(50000, "service-1", bigDiscountConfig, wednesday);
      expect(result).toEqual({ finalPrice: 0, hasDiscount: true });
    });

    it("BUG SCENARIO: today is Wednesday but booking is for Thursday - no discount", () => {
      // This is the exact bug that was fixed:
      // Today could be Wednesday, but the user selected Thursday
      const thursday = new Date("2025-01-02T12:00:00"); // Thursday
      const result = getDiscountedPrice(50000, "service-1", mockConfig, thursday);
      expect(result.hasDiscount).toBe(false);
      expect(result.finalPrice).toBe(50000);
    });

    it("BUG SCENARIO: today is Thursday but booking is for Wednesday - applies discount", () => {
      // Opposite case: today is not promo day but the selected date is
      const wednesday = new Date("2025-01-01T12:00:00"); // Wednesday
      const result = getDiscountedPrice(50000, "service-1", mockConfig, wednesday);
      expect(result.hasDiscount).toBe(true);
      expect(result.finalPrice).toBe(40000);
    });

    it("returns original price when config is undefined even with date", () => {
      const wednesday = new Date("2025-01-01T12:00:00");
      const result = getDiscountedPrice(50000, "service-1", undefined, wednesday);
      expect(result).toEqual({ finalPrice: 50000, hasDiscount: false });
    });
  });
});

describe("isPromoActive", () => {
  it("returns false when config is undefined", () => {
    expect(isPromoActive(undefined)).toBe(false);
  });

  it("returns false when promo is disabled", () => {
    expect(isPromoActive({ ...mockConfig, enabled: false })).toBe(false);
  });
});
