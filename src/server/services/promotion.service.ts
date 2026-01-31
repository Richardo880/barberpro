import { prisma } from "@/lib/prisma";

export interface PromotionConfig {
  enabled: boolean;
  day: number;
  discount: number;
  message: string;
  serviceIds: string[];
}

export interface PriceCalculation {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  promotionApplied: boolean;
}

/**
 * Obtiene la configuración de promoción desde la base de datos
 */
export async function getPromotionConfig(): Promise<PromotionConfig> {
  const configs = await prisma.appConfig.findMany({
    where: {
      key: {
        in: [
          "promo_enabled",
          "promo_day",
          "promo_discount",
          "promo_message",
          "promo_service_ids",
        ],
      },
    },
  });

  const configMap = new Map(configs.map((c) => [c.key, c.value]));

  return {
    enabled: configMap.get("promo_enabled") === "true",
    day: parseInt(configMap.get("promo_day") || "3"),
    discount: parseInt(configMap.get("promo_discount") || "10000"),
    message:
      configMap.get("promo_message") ||
      "¡Día de Promo! Cortes seleccionados con descuento",
    serviceIds: JSON.parse(configMap.get("promo_service_ids") || "[]"),
  };
}

/**
 * Verifica si una fecha específica es día de promoción
 */
export function isPromoDayForDate(
  config: PromotionConfig,
  date: Date
): boolean {
  if (!config.enabled) return false;
  return date.getDay() === config.day;
}

/**
 * Calcula el precio final considerando promociones
 * @param originalPrice Precio original del servicio
 * @param serviceId ID del servicio
 * @param date Fecha del servicio (para verificar si es día de promo)
 * @param config Configuración de promoción
 */
export function calculatePrice(
  originalPrice: number,
  serviceId: string,
  date: Date,
  config: PromotionConfig
): PriceCalculation {
  const isPromoDay = isPromoDayForDate(config, date);
  const serviceHasDiscount = config.serviceIds.includes(serviceId);
  const promotionApplied = isPromoDay && serviceHasDiscount;

  if (!promotionApplied) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      promotionApplied: false,
    };
  }

  const discountAmount = Math.min(config.discount, originalPrice);
  const finalPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    promotionApplied: true,
  };
}

/**
 * Obtiene la configuración y calcula el precio en un solo paso
 */
export async function calculatePriceWithPromotion(
  originalPrice: number,
  serviceId: string,
  date: Date
): Promise<PriceCalculation> {
  const config = await getPromotionConfig();
  return calculatePrice(originalPrice, serviceId, date, config);
}
