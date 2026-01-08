"use client";

import { useState } from "react";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Scissors, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
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

export default function ReservasPage() {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);

  const { data: upcomingData, isLoading: upcomingLoading } = useAppointments({
    status: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
  });

  const { data: pastData, isLoading: pastLoading } = useAppointments({
    status: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  });

  const cancelMutation = useCancelAppointment();

  const upcomingAppointments = (upcomingData?.appointments || []).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const pastAppointments = (pastData?.appointments || []).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const handleCancelClick = (id: string) => {
    setAppointmentToCancel(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    try {
      await cancelMutation.mutateAsync(appointmentToCancel);
      toast({
        title: "Turno cancelado",
        description: "Tu reserva ha sido cancelada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Mis Reservas"
          subtitle="Gestiona tus turnos y reservas"
          action={
            <Button asChild>
              <Link href="/mi-cuenta/nueva-reserva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Reserva
              </Link>
            </Button>
          }
        />

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximas ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Pasadas ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No tienes reservas próximas</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reserva un turno para ver tus próximas citas aquí
                </p>
                <Button asChild className="mt-4">
                  <Link href="/mi-cuenta/nueva-reserva">Reservar Ahora</Link>
                </Button>
              </div>
            ) : (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancelClick}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : pastAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No tienes historial de reservas</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tus turnos completados aparecerán aquí
                </p>
              </div>
            ) : (
              pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu turno será cancelado y deberás hacer
              una nueva reserva si cambias de opinión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface AppointmentCardProps {
  appointment: any;
  onCancel?: (id: string) => void;
}

function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const startDate = new Date(appointment.startTime);
  const canCancel =
    onCancel &&
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(startDate, "EEEE, d 'de' MMMM", { locale: es })}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(startDate, "HH:mm")} hs</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              statusColors[appointment.status as keyof typeof statusColors]
            }
          >
            {statusLabels[appointment.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="flex items-center space-x-2 text-sm">
          <Scissors className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{appointment.service.name}</span>
          <span className="text-muted-foreground">
            - ₲{" "}
            {typeof appointment.service.price === "number"
              ? appointment.service.price.toLocaleString("es-PY")
              : appointment.service.price}
          </span>
        </div>

        {appointment.staff && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Barbero: {appointment.staff.name}</span>
          </div>
        )}

        {appointment.clientNotes && (
          <div className="flex items-start space-x-2 rounded-md bg-muted p-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">{appointment.clientNotes}</p>
          </div>
        )}
      </CardContent>

      {canCancel && (
        <CardFooter>
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={() => onCancel(appointment.id)}
          >
            Cancelar Turno
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
