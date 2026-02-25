"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PromotionConfig {
  enabled: boolean;
  day: number;
  discount: number;
  message: string;
  serviceIds: string[];
}

interface PromotionResponse {
  promotion: PromotionConfig;
}

interface UpdatePromotionData {
  enabled?: boolean;
  day?: number;
  discount?: number;
  message?: string;
  serviceIds?: string[];
}

export function usePromotion() {
  return useQuery<PromotionResponse>({
    queryKey: ["promotion"],
    queryFn: async () => {
      const response = await fetch("/api/settings/promotion");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener promoción");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePromotionData) => {
      const response = await fetch("/api/settings/promotion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar promoción");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotion"] });
    },
  });
}

export function isPromoActive(config: PromotionConfig | undefined): boolean {
  if (!config || !config.enabled) return false;
  const today = new Date().getDay();
  return today === config.day;
}

export function isPromoDayForDate(config: PromotionConfig | undefined, date: Date): boolean {
  if (!config || !config.enabled) return false;
  return date.getDay() === config.day;
}

export function getDiscountedPrice(
  originalPrice: number,
  serviceId: string,
  config: PromotionConfig | undefined,
  date?: Date
): { finalPrice: number; hasDiscount: boolean } {
  const promoActive = date
    ? isPromoDayForDate(config, date)
    : isPromoActive(config);

  if (!config || !promoActive) {
    return { finalPrice: originalPrice, hasDiscount: false };
  }

  const hasDiscount = config.serviceIds.includes(serviceId);
  const finalPrice = hasDiscount
    ? Math.max(0, originalPrice - config.discount)
    : originalPrice;

  return { finalPrice, hasDiscount };
}
