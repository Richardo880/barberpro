"use client";

import { useState, useEffect } from "react";
import { usePromotion, useUpdatePromotion } from "@/hooks/use-promotion";
import { useServices } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, Save, Loader2 } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
];

export default function PromocionesPage() {
  const { toast } = useToast();
  const { data: promoData, isLoading: promoLoading } = usePromotion();
  const { data: servicesData, isLoading: servicesLoading } = useServices({ active: false });
  const updateMutation = useUpdatePromotion();

  const services = servicesData?.services || [];
  const promotion = promoData?.promotion;

  const [formData, setFormData] = useState({
    enabled: true,
    day: "3",
    discount: "10000",
    message: "¡Miércoles de Promo! Cortes seleccionados con ₲10.000 de descuento",
    serviceIds: [] as string[],
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        enabled: promotion.enabled,
        day: String(promotion.day),
        discount: String(promotion.discount),
        message: promotion.message,
        serviceIds: promotion.serviceIds,
      });
    }
  }, [promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        enabled: formData.enabled,
        day: parseInt(formData.day),
        discount: parseInt(formData.discount),
        message: formData.message,
        serviceIds: formData.serviceIds,
      });
      toast({
        title: "Promoción actualizada",
        description: "Los cambios han sido guardados correctamente",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la configuración";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: checked
        ? [...prev.serviceIds, serviceId]
        : prev.serviceIds.filter((id) => id !== serviceId),
    }));
  };

  const isLoading = promoLoading || servicesLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description="Configura las promociones semanales para tus clientes"
        icon={Tag}
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Define cuándo y cuánto descuento aplicar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Activar/Desactivar */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Promoción Activa</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar o deshabilitar la promoción
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                </div>

                {/* Día de la semana */}
                <div className="space-y-2">
                  <Label>Día de la promoción</Label>
                  <Select
                    value={formData.day}
                    onValueChange={(value) =>
                      setFormData({ ...formData, day: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un día" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto del descuento */}
                <div className="space-y-2">
                  <Label>Monto del descuento (₲)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    placeholder="10000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Este monto se restará del precio de los servicios seleccionados
                  </p>
                </div>

                {/* Mensaje del banner */}
                <div className="space-y-2">
                  <Label>Mensaje del banner</Label>
                  <Input
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="¡Miércoles de Promo!"
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground">
                    Se mostrará en la barra roja superior
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Servicios con promoción */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios con Promoción</CardTitle>
                <CardDescription>
                  Selecciona qué servicios tendrán el descuento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay servicios disponibles
                    </p>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          id={service.id}
                          checked={formData.serviceIds.includes(service.id)}
                          onCheckedChange={(checked) =>
                            handleServiceToggle(service.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={service.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {service.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            ₲ {typeof service.price === "number"
                              ? service.price.toLocaleString("es-PY")
                              : service.price}
                            {formData.serviceIds.includes(service.id) && (
                              <span className="ml-2 text-green-600">
                                → ₲ {Math.max(0, (typeof service.price === "number" ? service.price : parseFloat(String(service.price))) - parseInt(formData.discount || "0")).toLocaleString("es-PY")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botón de guardar */}
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
