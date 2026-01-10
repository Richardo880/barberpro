"use client";

import { useState } from "react";
import { useStaff, useDeleteStaff, StaffMember } from "@/hooks/use-staff";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StaffDialog } from "@/components/admin/staff-dialog";
import { Users, Plus, Edit, Eye, EyeOff, Trash2 } from "lucide-react";

export default function StaffPage() {
  const { toast } = useToast();
  const { data: staffData, isLoading } = useStaff(true); // Incluir inactivos
  const deleteMutation = useDeleteStaff();
  const staff = staffData?.staff || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  const handleCreate = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: StaffMember) => {
    setStaffToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      const result = await deleteMutation.mutateAsync(staffToDelete.id);
      toast({
        title: result.deactivated ? "Staff desactivado" : "Staff eliminado",
        description: result.deactivated
          ? "El miembro del staff tiene citas pendientes y fue desactivado"
          : "El miembro del staff ha sido eliminado correctamente",
      });
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el staff",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Gestión de Staff"
          subtitle="Administra los barberos y empleados de tu barbería"
        />
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Barbero
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12" />
              <p>No hay miembros del staff registrados</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar primer barbero
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Foto</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.photoUrl || undefined} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.bio && (
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {member.bio}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{member.email}</div>
                        {member.phone && (
                          <div className="text-muted-foreground">{member.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties && member.specialties.length > 0 ? (
                          member.specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                        {member.specialties && member.specialties.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{member.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.services && member.services.length > 0 ? (
                          <span>{member.services.length} servicio(s)</span>
                        ) : (
                          <span className="text-muted-foreground">Ninguno</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-100 text-green-800"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-gray-200 bg-gray-100 text-gray-800"
                        >
                          <EyeOff className="mr-1 h-3 w-3" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(member)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {staffData && staff.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Total de miembros del staff: {staff.length}
        </div>
      )}

      {/* Diálogo de crear/editar */}
      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro del staff?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a "{staffToDelete?.name}"?
              <span className="mt-2 block text-muted-foreground">
                Si tiene citas pendientes, será desactivado en lugar de eliminado.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
