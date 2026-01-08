"use client";

import { useEffect, useState } from "react";
import { useCreateService, useUpdateService } from "@/hooks/use-services";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
    imageUrl: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del servicio si estamos editando
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        duration: service.duration,
        price: service.price,
        imageUrl: service.imageUrl || "",
        isActive: service.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration: 30,
        price: 0,
        imageUrl: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [service, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }

    if (formData.duration < 5) {
      newErrors.duration = "La duración mínima es 5 minutos";
    }

    if (formData.price < 0) {
      newErrors.price = "El precio no puede ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration: formData.duration,
        price: formData.price,
        imageUrl: formData.imageUrl.trim() || undefined,
        isActive: formData.isActive,
      };

      if (service) {
        await updateMutation.mutateAsync({ id: service.id, data });
        toast({
          title: "Servicio actualizado",
          description: "El servicio ha sido actualizado exitosamente",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Servicio creado",
          description: "El servicio ha sido creado exitosamente",
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el servicio",
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {service ? "Editar Servicio" : "Nuevo Servicio"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Modifica los datos del servicio"
              : "Completa los datos para crear un nuevo servicio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Corte de cabello"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del servicio (opcional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* URL de Imagen */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de Imagen de Referencia</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg (opcional)"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Agrega una URL de imagen para mostrar una referencia visual del servicio
              </p>
            </div>

            {/* Duración y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duración (min) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isLoading}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={isLoading}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Estado Activo */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Servicio Activo</Label>
                <p className="text-sm text-muted-foreground">
                  Los servicios inactivos no aparecen en el formulario de reservas
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : service ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
