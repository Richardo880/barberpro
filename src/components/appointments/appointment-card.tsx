"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Scissors, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Role } from "@prisma/client";

interface Appointment {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  clientNotes?: string | null;
  client?: {
    id: string;
    name: string;
    phone?: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number | string;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
}

interface AppointmentCardProps {
  appointment: Appointment;
  role?: Role;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
}

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

export function AppointmentCard({
  appointment,
  role,
  onCancel,
  onConfirm,
  onComplete,
}: AppointmentCardProps) {
  const startDate = new Date(appointment.startTime);
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const canCancel = appointment.status === "PENDING" || appointment.status === "CONFIRMED";

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
            className={statusColors[appointment.status as keyof typeof statusColors]}
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
            - ₲ {typeof appointment.service.price === 'number'
              ? appointment.service.price.toLocaleString('es-PY')
              : appointment.service.price}
          </span>
        </div>

        {appointment.staff && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Barbero: {appointment.staff.name}</span>
          </div>
        )}

        {isAdmin && appointment.client && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Cliente: {appointment.client.name}</span>
            {appointment.client.phone && (
              <span className="text-xs">({appointment.client.phone})</span>
            )}
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
        <CardFooter className="flex gap-2">
          {isAdmin && appointment.status === "PENDING" && onConfirm && (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => onConfirm(appointment.id)}
            >
              Confirmar
            </Button>
          )}
          {isAdmin && appointment.status === "CONFIRMED" && onComplete && (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => onComplete(appointment.id)}
            >
              Marcar Completado
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onCancel(appointment.id)}
            >
              Cancelar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
