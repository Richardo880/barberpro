import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Scissors } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number | string;
  imageUrl?: string | null;
  isActive?: boolean;
}

interface ServiceCardProps {
  service: Service;
  variant?: "public" | "admin";
  onEdit?: (service: Service) => void;
}

export function ServiceCard({ service, variant = "public", onEdit }: ServiceCardProps) {
  const formattedPrice = typeof service.price === "number"
    ? service.price.toLocaleString("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 })
    : `₲ ${service.price}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Imagen del servicio */}
      {service.imageUrl ? (
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <img
            src={service.imageUrl}
            alt={service.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted">
          <Scissors className="h-16 w-16 text-muted-foreground/50" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          {variant === "admin" && !service.isActive && (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </div>
        {service.description && (
          <CardDescription className="line-clamp-2">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>{service.duration} minutos</span>
          </div>
          <div className="flex items-center text-lg font-bold text-primary">
            <DollarSign className="mr-1 h-5 w-5" />
            <span>{formattedPrice}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {variant === "public" ? (
          <Button className="w-full" asChild>
            <Link href={`/reservar?service=${service.id}`}>
              Reservar
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => onEdit?.(service)}
          >
            Editar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
