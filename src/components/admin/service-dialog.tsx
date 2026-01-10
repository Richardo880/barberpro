"use client";

import { useEffect, useState } from "react";
import { useCreateService, useUpdateService, Service } from "@/hooks/use-services";
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
import { Upload, X, Scissors } from "lucide-react";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cargar datos del servicio si estamos editando
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        duration: service.duration,
        price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
        imageUrl: service.imageUrl || "",
        isActive: service.isActive ?? true,
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
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
  }, [service, open]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Solo puedes subir archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsUploading(true);

      let imageUrl = formData.imageUrl;

      // Subir imagen si hay una nueva seleccionada
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload/services", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          const errorMsg = uploadData.hint || uploadData.details || uploadData.error || "Error al subir la imagen";
          throw new Error(errorMsg);
        }

        imageUrl = uploadData.url;
      }

      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration: formData.duration,
        price: formData.price,
        imageUrl: imageUrl || undefined,
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
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  // Determinar qué imagen mostrar
  const displayImageUrl = previewUrl || formData.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
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
            {/* Imagen */}
            <div className="space-y-2">
              <Label>Imagen del Servicio</Label>
              <div className="flex items-start gap-4">
                {/* Preview de imagen */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {displayImageUrl ? (
                    <>
                      <img
                        src={displayImageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={removeImage}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Scissors className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Botón de upload */}
                <div className="flex-1 space-y-2">
                  <Input
                    id="service-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("service-image-upload")?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {displayImageUrl ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Imagen de referencia del servicio (opcional)
                  </p>
                </div>
              </div>
            </div>

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
              {isUploading
                ? "Subiendo imagen..."
                : (createMutation.isPending || updateMutation.isPending)
                ? "Guardando..."
                : service ? "Actualizar" : "Crear"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
