"use client";

import { useAdminStats } from "@/hooks/use-admin";
import { useUpdateAppointment } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Calendar, Clock, DollarSign, Users, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();
  const updateMutation = useUpdateAppointment();
  const { toast } = useToast();

  const handleConfirm = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: AppointmentStatus.CONFIRMED },
      });
      toast({
        title: "Turno confirmado",
        description: "El turno ha sido confirmado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar el turno",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: AppointmentStatus.COMPLETED },
      });
      toast({
        title: "Turno completado",
        description: "El turno ha sido marcado como completado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar como completado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Administrativo"
        subtitle="Vista general del negocio y turnos de hoy"
      />

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.appointmentsToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Programados para hoy
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.appointmentsPending || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por confirmar
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ₲ {(stats?.monthlyRevenue || 0).toLocaleString("es-PY")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Servicios completados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalClients || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.newClientsThisMonth || 0} este mes
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Turnos de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !stats?.upcomingToday || stats.upcomingToday.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay turnos programados para hoy
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingToday.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {format(new Date(appointment.startTime), "HH:mm")} hs
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {appointment.service.duration} min
                      </span>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div>
                      <p className="font-medium">{appointment.client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service.name}
                        {appointment.staff && ` - ${appointment.staff.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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

                    {appointment.status === AppointmentStatus.PENDING && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(appointment.id)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Confirmar
                      </Button>
                    )}

                    {appointment.status === AppointmentStatus.CONFIRMED && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(appointment.id)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
