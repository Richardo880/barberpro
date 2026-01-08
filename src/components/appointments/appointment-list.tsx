import { AppointmentCard } from "./appointment-card";
import { Skeleton } from "@/components/ui/skeleton";
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

interface AppointmentListProps {
  appointments: Appointment[];
  role?: Role;
  loading?: boolean;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  emptyMessage?: string;
}

export function AppointmentList({
  appointments,
  role,
  loading,
  onCancel,
  onConfirm,
  onComplete,
  emptyMessage = "No hay turnos para mostrar",
}: AppointmentListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Los turnos que reserves aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          role={role}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}
