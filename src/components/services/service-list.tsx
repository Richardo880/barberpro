import { ServiceCard } from "./service-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number | string;
  imageUrl?: string | null;
  isActive?: boolean;
}

interface ServiceListProps {
  services: Service[];
  variant?: "public" | "admin";
  loading?: boolean;
  onEdit?: (service: Service) => void;
}

export function ServiceList({ services, variant = "public", loading, onEdit }: ServiceListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium">No hay servicios disponibles</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {variant === "admin"
            ? "Agrega servicios para que los clientes puedan reservar turnos"
            : "Vuelve pronto para ver nuestros servicios"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          variant={variant}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 rounded-lg border p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <div className="flex-1" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
