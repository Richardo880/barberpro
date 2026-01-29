import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePromotionSchema = z.object({
  enabled: z.boolean().optional(),
  day: z.number().int().min(0).max(6).optional(),
  discount: z.number().int().min(0).optional(),
  message: z.string().min(1).max(200).optional(),
  serviceIds: z.array(z.string()).optional(),
});

export interface PromotionConfig {
  enabled: boolean;
  day: number;
  discount: number;
  message: string;
  serviceIds: string[];
}

async function getPromotionConfig(): Promise<PromotionConfig> {
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

export async function GET() {
  try {
    const config = await getPromotionConfig();
    return NextResponse.json({ promotion: config });
  } catch (error) {
    console.error("Error al obtener configuración de promoción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden modificar promociones" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updatePromotionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { enabled, day, discount, message, serviceIds } = validationResult.data;

    const updates: Promise<unknown>[] = [];

    if (enabled !== undefined) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key: "promo_enabled" },
          update: { value: String(enabled) },
          create: {
            key: "promo_enabled",
            value: String(enabled),
            type: "boolean",
            description: "Habilitar/deshabilitar promoción semanal",
          },
        })
      );
    }

    if (day !== undefined) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key: "promo_day" },
          update: { value: String(day) },
          create: {
            key: "promo_day",
            value: String(day),
            type: "number",
            description: "Día de la semana para la promoción",
          },
        })
      );
    }

    if (discount !== undefined) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key: "promo_discount" },
          update: { value: String(discount) },
          create: {
            key: "promo_discount",
            value: String(discount),
            type: "number",
            description: "Monto del descuento en guaraníes",
          },
        })
      );
    }

    if (message !== undefined) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key: "promo_message" },
          update: { value: message },
          create: {
            key: "promo_message",
            value: message,
            type: "string",
            description: "Mensaje del banner de promoción",
          },
        })
      );
    }

    if (serviceIds !== undefined) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key: "promo_service_ids" },
          update: { value: JSON.stringify(serviceIds) },
          create: {
            key: "promo_service_ids",
            value: JSON.stringify(serviceIds),
            type: "json",
            description: "IDs de servicios con promoción",
          },
        })
      );
    }

    await Promise.all(updates);

    const config = await getPromotionConfig();
    return NextResponse.json({ promotion: config });
  } catch (error) {
    console.error("Error al actualizar configuración de promoción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
