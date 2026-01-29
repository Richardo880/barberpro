"use client";

import { useEffect, useState } from "react";
import { useCreateRecord, useUpdateRecord } from "@/hooks/use-records";
import { useServices } from "@/hooks/use-services";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload } from "lucide-react";

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  record?: any; // Record existente para edición
}

export function RecordDialog({ open, onOpenChange, clientId, clientName, record }: RecordDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const { data: servicesData } = useServices({ active: true }); // Solo servicios activos

  const [formData, setFormData] = useState({
    serviceId: "",
    date: new Date().toISOString().split("T")[0],
    price: 0,
    notes: "",
    tags: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const services = servicesData?.services || [];
  const isEditMode = !!record;

  useEffect(() => {
    if (open) {
      if (record) {
        // Modo edición: prellenar con datos del record
        setFormData({
          serviceId: record.serviceId,
          date: new Date(record.date).toISOString().split("T")[0],
          price: Number(record.price),
          notes: record.notes || "",
          tags: record.tags?.join(", ") || "",
        });
        setExistingPhotoUrls(record.photoUrls || []);
      } else {
        // Modo creación: resetear formulario
        setFormData({
          serviceId: "",
          date: new Date().toISOString().split("T")[0],
          price: 0,
          notes: "",
          tags: "",
        });
        setExistingPhotoUrls([]);
      }
      setSelectedFiles([]);
      setPreviewUrls([]);
      setErrors({});
    }
  }, [open, record]);

  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceId) {
      newErrors.serviceId = "Debes seleccionar un servicio";
    }

    if (!formData.date) {
      newErrors.date = "La fecha es requerida";
    }

    if (formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
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
      setIsUploading(true);

      let newPhotoUrls: string[] = [];

      // Si hay archivos seleccionados, subirlos primero
      if (selectedFiles.length > 0) {
        const uploadFormData = new FormData();
        selectedFiles.forEach(file => {
          uploadFormData.append("files", file);
        });
        uploadFormData.append("clientName", clientName);

        const uploadResponse = await fetch("/api/upload/records", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          const errorMsg = uploadData.hint || uploadData.details || uploadData.error || "Error al subir las fotos";
          throw new Error(errorMsg);
        }

        newPhotoUrls = uploadData.urls;
      }

      // Combinar fotos existentes con las nuevas
      const allPhotoUrls = [...existingPhotoUrls, ...newPhotoUrls];

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (isEditMode) {
        // Modo edición
        await updateMutation.mutateAsync({
          id: record.id,
          data: {
            serviceId: formData.serviceId,
            date: new Date(formData.date).toISOString(),
            price: formData.price,
            notes: formData.notes || undefined,
            tags,
            photoUrls: allPhotoUrls,
          },
        });

        toast({
          title: "Registro actualizado",
          description: "El corte ha sido actualizado exitosamente",
        });
      } else {
        // Modo creación
        await createMutation.mutateAsync({
          clientId,
          serviceId: formData.serviceId,
          date: new Date(formData.date).toISOString(),
          price: formData.price,
          notes: formData.notes || undefined,
          tags,
          photoUrls: allPhotoUrls,
        });

        toast({
          title: "Registro creado",
          description: "El corte ha sido registrado exitosamente",
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `No se pudo ${isEditMode ? "actualizar" : "crear"} el registro`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, serviceId });

    // Auto-fill price from service
    const selectedService = services.find((s: any) => s.id === serviceId);
    if (selectedService) {
      setFormData((prev) => ({
        ...prev,
        serviceId,
        price: Number(selectedService.price),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Limitar a 4 fotos
    if (files.length > 4) {
      toast({
        title: "Demasiados archivos",
        description: "Puedes subir un máximo de 4 fotos",
        variant: "destructive",
      });
      return;
    }

    // Validar que sean imágenes
    const validFiles = files.filter(file => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      toast({
        title: "Archivos inválidos",
        description: "Solo puedes subir archivos de imagen",
        variant: "destructive",
      });
    }

    setSelectedFiles(validFiles);

    // Crear previews
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    previewUrls.forEach(url => URL.revokeObjectURL(url)); // Limpiar previews anteriores
    setPreviewUrls(newPreviewUrls);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    URL.revokeObjectURL(previewUrls[index]);
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  const removeExistingPhoto = (index: number) => {
    const newPhotoUrls = [...existingPhotoUrls];
    newPhotoUrls.splice(index, 1);
    setExistingPhotoUrls(newPhotoUrls);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Registro de Corte" : "Registrar Corte Realizado"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Actualiza los detalles del corte de ${clientName}`
              : `Agrega un nuevo registro de corte para ${clientName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Servicio */}
            <div className="space-y-2">
              <Label htmlFor="serviceId">
                Servicio <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceId}
                onValueChange={handleServiceChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && (
                <p className="text-sm text-red-500">{errors.serviceId}</p>
              )}
            </div>

            {/* Fecha y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Fecha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  disabled={isLoading}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
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

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas del Corte</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Fade alto, diseño en lateral..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={isLoading}
                rows={2}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                placeholder="Ej: fade, diseño, degradado (separadas por comas)"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Separa las etiquetas con comas
              </p>
            </div>

            {/* Fotos */}
            <div className="space-y-3">
              <Label>Fotos del Resultado</Label>

              {/* Fotos existentes (en modo edición) */}
              {existingPhotoUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Fotos actuales:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {existingPhotoUrls.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={url}
                          alt={`Foto existente ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6"
                          onClick={() => removeExistingPhoto(index)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File input para nuevas fotos */}
              <div className="flex items-center gap-2">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isLoading || (existingPhotoUrls.length + selectedFiles.length >= 4)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  disabled={isLoading || (existingPhotoUrls.length + selectedFiles.length >= 4)}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} foto${selectedFiles.length > 1 ? "s" : ""} nueva${selectedFiles.length > 1 ? "s" : ""}`
                    : isEditMode ? "Agregar más fotos" : "Seleccionar fotos"
                  }
                </Button>
              </div>

              {/* Preview de fotos nuevas seleccionadas */}
              {previewUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Nuevas fotos a subir:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {previewUrls.map((url, index) => (
                      <div
                        key={`preview-${index}`}
                        className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6"
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Máximo 4 fotos en total. Las fotos se guardarán en /images/records/{clientName.toLowerCase().replace(/\s+/g, "-")}/
              </p>
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
                ? "Subiendo fotos..."
                : (createMutation.isPending || updateMutation.isPending)
                ? "Guardando..."
                : isEditMode
                ? "Actualizar Registro"
                : "Guardar Registro"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
