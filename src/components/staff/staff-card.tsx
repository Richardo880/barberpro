import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Scissors } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  bio?: string | null;
  photoUrl?: string | null;
  specialties?: string[];
  services?: Array<{
    id: string;
    name: string;
  }>;
}

interface StaffCardProps {
  staff: Staff;
  onSelect?: (staffId: string) => void;
  selected?: boolean;
}

export function StaffCard({ staff, onSelect, selected }: StaffCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={selected ? "border-primary shadow-md" : "transition-shadow hover:shadow-md"}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={staff.photoUrl || undefined} alt={staff.name} />
            <AvatarFallback className="text-2xl">{getInitials(staff.name)}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle>{staff.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {staff.bio && (
          <p className="text-center text-sm text-muted-foreground">{staff.bio}</p>
        )}

        {staff.specialties && staff.specialties.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Especialidades
            </p>
            <div className="flex flex-wrap gap-1">
              {staff.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {staff.services && staff.services.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Servicios
            </p>
            <div className="space-y-1">
              {staff.services.slice(0, 3).map((service) => (
                <div key={service.id} className="flex items-center text-sm">
                  <Scissors className="mr-2 h-3 w-3 text-muted-foreground" />
                  <span>{service.name}</span>
                </div>
              ))}
              {staff.services.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{staff.services.length - 3} más
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {onSelect ? (
          <Button
            className="w-full"
            variant={selected ? "default" : "outline"}
            onClick={() => onSelect(staff.id)}
          >
            {selected ? "Seleccionado" : "Seleccionar"}
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/reservar?staff=${staff.id}`}>
              Reservar con {staff.name.split(" ")[0]}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
