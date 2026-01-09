"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { useRecords } from "@/hooks/use-records";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/shared/image-lightbox";
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
import {
  Calendar,
  Clock,
  Award,
  Plus,
  List,
  History,
  Scissors,
  User,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentStatus } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

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

export default function MiCuentaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reservas");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const { data: upcomingData, isLoading: upcomingLoading } = useAppointments({
    status: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
  });
  const { data: pastAppointmentsData, isLoading: pastLoading } = useAppointments({
    status: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  });
  const { data: recordsData, isLoading: recordsLoading } = useRecords();
  const cancelMutation = useCancelAppointment();

  const upcomingAppointments = (upcomingData?.appointments || []).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const pastAppointments = (pastAppointmentsData?.appointments || []).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const records = recordsData?.records || [];

  const nextAppointment = upcomingAppointments[0];
  const pendingAppointments = upcomingAppointments.filter(
    (a) => a.status === AppointmentStatus.PENDING
  ).length;
  const totalCuts = records.length;
  const lastCut = records.length > 0 ? records[0] : null;

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

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    const colors = {
      [AppointmentStatus.PENDING]: "bg-yellow-500",
      [AppointmentStatus.CONFIRMED]: "bg-blue-500",
      [AppointmentStatus.COMPLETED]: "bg-green-500",
      [AppointmentStatus.CANCELLED]: "bg-gray-500",
      [AppointmentStatus.NO_SHOW]: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      [AppointmentStatus.PENDING]: "Pendiente",
      [AppointmentStatus.CONFIRMED]: "Confirmado",
      [AppointmentStatus.COMPLETED]: "Completado",
      [AppointmentStatus.CANCELLED]: "Cancelado",
      [AppointmentStatus.NO_SHOW]: "No asistió",
    };
    return labels[status];
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona tus reservas y perfil desde aquí
        </p>
      </div>

      {/* Quick Actions Menu */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Button size="lg" asChild>
          <Link href="/mi-cuenta/nueva-reserva">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Reserva
          </Link>
        </Button>
        <Button
          size="lg"
          variant={activeTab === "reservas" ? "default" : "outline"}
          onClick={() => setActiveTab("reservas")}
        >
          <List className="mr-2 h-5 w-5" />
          Mis Reservas
        </Button>
        <Button
          size="lg"
          variant={activeTab === "historial" ? "default" : "outline"}
          onClick={() => setActiveTab("historial")}
        >
          <History className="mr-2 h-5 w-5" />
          Mi Historial
        </Button>
      </div>

      {/* Next Appointment */}
      {!upcomingLoading && nextAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximo Turno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(nextAppointment.startTime), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-medium">{nextAppointment.service.name}</p>
                </div>
                {nextAppointment.staff && (
                  <div>
                    <p className="text-sm text-muted-foreground">Barbero</p>
                    <p className="font-medium">{nextAppointment.staff.name}</p>
                  </div>
                )}
              </div>
              <Badge className={getStatusColor(nextAppointment.status)}>
                {getStatusLabel(nextAppointment.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold">{pendingAppointments}</p>
            <p className="text-sm text-muted-foreground">
              {pendingAppointments === 1 ? "Reserva pendiente" : "Reservas pendientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold">{totalCuts}</p>
            <p className="text-sm text-muted-foreground">
              {totalCuts === 1 ? "Corte realizado" : "Cortes realizados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold">
              {lastCut ? format(new Date(lastCut.date), "d MMM", { locale: es }) : "-"}
            </p>
            <p className="text-sm text-muted-foreground">Último corte</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab: Mis Reservas */}
        <TabsContent value="reservas" className="space-y-6">
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
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
        </TabsContent>

        {/* Tab: Mi Historial */}
        <TabsContent value="historial" className="space-y-6">
          {recordsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 w-1/3 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                      <div className="h-20 w-full rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : records.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Scissors className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No hay cortes registrados</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tus cortes completados aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {records.map((record: any) => (
                <Card key={record.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid gap-6 p-6 lg:grid-cols-3">
                      {/* Información del corte */}
                      <div className="lg:col-span-1">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {record.service.name}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(record.date), "d 'de' MMMM, yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>

                          {record.staff && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Atendido por: {record.staff.name}</span>
                            </div>
                          )}

                          <div className="text-lg font-bold text-primary">
                            ${record.price}
                          </div>

                          {record.tags && record.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {record.tags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {record.notes && (
                            <div className="rounded-lg bg-muted p-3">
                              <p className="text-sm font-medium">Notas:</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {record.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fotos del resultado */}
                      <div className="lg:col-span-2">
                        {record.photoUrls && record.photoUrls.length > 0 ? (
                          <div>
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              Fotos del resultado
                            </h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                              {record.photoUrls.map((url: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                                  onClick={() => openLightbox(record.photoUrls, idx)}
                                >
                                  <img
                                    src={url}
                                    alt={`Foto ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
                            <div className="text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                              <p className="mt-2 text-sm text-muted-foreground">
                                Sin fotos registradas
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
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

      {/* Lightbox para ver fotos en pantalla completa */}
      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxInitialIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
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
