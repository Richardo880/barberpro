"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useRecords } from "@/hooks/use-records";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Award, Plus, List, History } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@prisma/client";

export default function MiCuentaPage() {
  const { user } = useAuth();
  const { data: appointmentsData, isLoading } = useAppointments({
    status: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
  });
  const { data: recordsData } = useRecords();

  const appointments = appointmentsData?.appointments || [];
  const records = recordsData?.records || [];
  const nextAppointment = appointments.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];

  const totalAppointments = appointmentsData?.total || 0;
  const totalCuts = records.length;
  const lastCut = records.length > 0 ? records[0] : null;

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

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Button size="lg" asChild>
          <Link href="/mi-cuenta/nueva-reserva">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Reserva
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/mi-cuenta/reservas">
            <List className="mr-2 h-5 w-5" />
            Mis Reservas
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/mi-cuenta/historial">
            <History className="mr-2 h-5 w-5" />
            Mi Historial
          </Link>
        </Button>
      </div>

      {/* Next Appointment */}
      {!isLoading && nextAppointment && (
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
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/mi-cuenta/reservas">Ver detalles</Link>
            </Button>
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
            <p className="mt-4 text-3xl font-bold">{totalAppointments}</p>
            <p className="text-sm text-muted-foreground">
              {totalAppointments === 1 ? "Reserva activa" : "Reservas activas"}
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
    </div>
  );
}
