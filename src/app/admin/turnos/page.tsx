"use client";

import { useState } from "react";
import { useAppointments, useUpdateAppointment } from "@/hooks/use-appointments";
import { useStaff } from "@/hooks/use-staff";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Filter, CheckCircle, XCircle, Clock, ImageIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentStatus } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SortableHeader, useSortState } from "@/components/ui/sortable-header";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "No asistió",
};

const paymentStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const paymentStatusLabels = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export default function TurnosPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [proofDialogUrl, setProofDialogUrl] = useState<string | null>(null);

  const { sortKey, sortDirection, handleSort, sortData } = useSortState<any>("fecha", "asc");

  const { data: staffData } = useStaff();
  const staff = staffData?.staff || [];

  // Build filter params
  const filterParams: any = {};
  if (selectedDate) {
    filterParams.date = format(selectedDate, "yyyy-MM-dd");
  }
  if (selectedStatus !== "all") {
    filterParams.status = [selectedStatus as AppointmentStatus];
  }
  if (selectedStaff !== "all") {
    filterParams.staffId = selectedStaff;
  }

  const { data: appointmentsData, isLoading } = useAppointments(filterParams);
  const updateMutation = useUpdateAppointment();

  const sortedAppointments = sortData(appointmentsData?.appointments || [], {
    fecha: (item) => new Date(item.startTime),
    cliente: (item) => item.client?.name || "",
    servicio: (item) => item.service?.name || "",
    barbero: (item) => item.staff?.name || "ZZZ",
    estado: (item) => item.status,
  });

  const appointments = sortedAppointments;

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status } });
      toast({
        title: "Estado actualizado",
        description: "El turno ha sido actualizado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el turno",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { paymentStatus } });
      toast({
        title: "Pago actualizado",
        description: paymentStatus === "APPROVED" ? "Comprobante aprobado" : "Comprobante rechazado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pago",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedStatus("all");
    setSelectedStaff("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Turnos"
        subtitle="Administra y confirma las reservas de tus clientes"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      selectedDate && "border-primary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="NO_SHOW">No asistió</SelectItem>
                </SelectContent>
              </Select>

              {/* Staff Filter */}
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Barbero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedDate || selectedStatus !== "all" || selectedStaff !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="mx-auto mb-4 h-12 w-12" />
              <p>No se encontraron turnos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Fecha/Hora"
                        sortKey="fecha"
                        currentSort={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Cliente"
                        sortKey="cliente"
                        currentSort={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Servicio"
                        sortKey="servicio"
                        currentSort={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Barbero"
                        sortKey="barbero"
                        currentSort={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortableHeader
                        label="Estado"
                        sortKey="estado"
                        currentSort={sortKey}
                        currentDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pago</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium">
                          {format(new Date(appointment.startTime), "d 'de' MMM", {
                            locale: es,
                          })}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(appointment.startTime), "HH:mm")} hs
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{appointment.client?.name}</div>
                        {appointment.client?.phone && (
                          <div className="text-sm text-muted-foreground">
                            {appointment.client.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{appointment.service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.service.duration} min
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {appointment.staff ? appointment.staff.name : "Sin asignar"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={
                            statusColors[
                              appointment.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </td>
                      {/* Payment Status Column */}
                      <td className="px-4 py-4">
                        {appointment.paymentProofUrl ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => setProofDialogUrl(appointment.paymentProofUrl!)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ImageIcon className="h-3 w-3" />
                              Ver comprobante
                            </button>
                            <Badge
                              variant="outline"
                              className={
                                paymentStatusColors[
                                  (appointment.paymentStatus || "PENDING") as keyof typeof paymentStatusColors
                                ]
                              }
                            >
                              {paymentStatusLabels[(appointment.paymentStatus || "PENDING") as keyof typeof paymentStatusLabels]}
                            </Badge>
                            {(appointment.paymentStatus === "PENDING" || !appointment.paymentStatus) && (
                              <div className="flex gap-1 mt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => handleUpdatePaymentStatus(appointment.id, "APPROVED")}
                                  disabled={updateMutation.isPending}
                                  title="Aprobar pago"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => handleUpdatePaymentStatus(appointment.id, "REJECTED")}
                                  disabled={updateMutation.isPending}
                                  title="Rechazar pago"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          {appointment.status === AppointmentStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateStatus(appointment.id, AppointmentStatus.CONFIRMED)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateStatus(appointment.id, AppointmentStatus.CANCELLED)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {appointment.status === AppointmentStatus.CONFIRMED && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateStatus(appointment.id, AppointmentStatus.COMPLETED)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateStatus(appointment.id, AppointmentStatus.NO_SHOW)
                                }
                                disabled={updateMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {appointmentsData?.total && appointmentsData.total > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {appointments.length} de {appointmentsData.total} turnos
        </div>
      )}

      {/* Dialog para ver comprobante */}
      <Dialog open={!!proofDialogUrl} onOpenChange={() => setProofDialogUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprobante de transferencia</DialogTitle>
          </DialogHeader>
          {proofDialogUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={proofDialogUrl}
                alt="Comprobante de pago"
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
