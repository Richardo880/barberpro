"use client";

import { useEffect, useState } from "react";
import {
  useCreateStaff,
  useUpdateStaff,
  StaffMember,
  CreateStaffData,
  UpdateStaffData,
} from "@/hooks/use-staff";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, User } from "lucide-react";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffMember | null;
}

export function StaffDialog({ open, onOpenChange, staff }: StaffDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const { data: servicesData } = useServices(false);
  const services = servicesData?.services || [];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    photoUrl: "",
    specialties: "",
    serviceIds: [] as string[],
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isEditMode = !!staff;

  // Cargar datos del staff si estamos editando
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        password: "",
        phone: staff.phone || "",
        bio: staff.bio || "",
        photoUrl: staff.photoUrl || "",
        specialties: staff.specialties?.join(", ") || "",
        serviceIds: staff.services?.map((s) => s.id) || [],
        isActive: staff.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        bio: "",
        photoUrl: "",
        specialties: "",
        serviceIds: [],
        isActive: true,
      });
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors({});
  }, [staff, open]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
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
    setFormData({ ...formData, photoUrl: "" });
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsUploading(true);

      let photoUrl = formData.photoUrl;

      // Subir imagen si hay una nueva seleccionada
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload/staff", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Error al subir la imagen");
        }

        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.url;
      }

      const specialties = formData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (isEditMode && staff) {
        const updateData: UpdateStaffData = {
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          photoUrl: photoUrl || null,
          specialties,
          serviceIds: formData.serviceIds,
          isActive: formData.isActive,
        };

        await updateMutation.mutateAsync({ id: staff.id, data: updateData });
        toast({
          title: "Staff actualizado",
          description: "El miembro del staff ha sido actualizado exitosamente",
        });
      } else {
        const createData: CreateStaffData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          photoUrl: photoUrl || undefined,
          specialties,
          serviceIds: formData.serviceIds,
        };

        await createMutation.mutateAsync(createData);
        toast({
          title: "Staff creado",
          description: "El miembro del staff ha sido creado exitosamente",
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el staff",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;
  const displayImageUrl = previewUrl || formData.photoUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Miembro del Staff" : "Nuevo Miembro del Staff"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica los datos del barbero"
              : "Completa los datos para agregar un nuevo barbero"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Foto */}
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
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
                        className="absolute right-0 top-0 h-6 w-6"
                        onClick={removeImage}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Input
                    id="staff-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("staff-image-upload")?.click()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {displayImageUrl ? "Cambiar foto" : "Subir foto"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Foto del barbero para mostrar en el sitio
                  </p>
                </div>
              </div>
            </div>

            {/* Nombre y Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading || isEditMode}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            {/* Contraseña (solo para crear) */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            )}

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+54 9 11 1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                placeholder="Descripción del barbero, experiencia, etc."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Especialidades */}
            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades</Label>
              <Input
                id="specialties"
                placeholder="Ej: fade, barba, diseño (separadas por comas)"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Separa las especialidades con comas
              </p>
            </div>

            {/* Servicios */}
            <div className="space-y-2">
              <Label>Servicios que realiza</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay servicios disponibles
                  </p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.serviceIds.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {service.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Estado Activo (solo en edición) */}
            {isEditMode && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Staff Activo</Label>
                  <p className="text-sm text-muted-foreground">
                    El staff inactivo no aparece disponible para reservas
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
            )}
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
                ? "Subiendo foto..."
                : createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : isEditMode
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
