"use client";

import { useStaff } from "@/hooks/use-staff";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function BarberosPage() {
  const { data: staffData, isLoading } = useStaff();
  const staff = staffData?.staff || [];

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Nuestro Equipo"
        subtitle="Conoce a nuestros profesionales altamente capacitados"
      />

      <div className="mt-12">
        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="mx-auto h-32 w-32 rounded-full bg-muted" />
                    <div className="h-6 w-40 rounded bg-muted mx-auto" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted mx-auto" />
                    <div className="flex justify-center gap-2">
                      <div className="h-6 w-20 rounded-full bg-muted" />
                      <div className="h-6 w-20 rounded-full bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay barberos disponibles en este momento
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card key={member.id} className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                <CardContent className="p-6 text-center h-full flex flex-col">
                  {/* Avatar */}
                  <Avatar className="mx-auto h-32 w-32 border-4 border-background shadow-md">
                    <AvatarImage src={member.photoUrl || undefined} />
                    <AvatarFallback className="text-3xl">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Nombre */}
                  <h3 className="mt-6 text-xl font-semibold">{member.name}</h3>

                  {/* Bio - altura fija para alinear */}
                  <div className="mt-3 min-h-[4.5rem]">
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  {/* Servicios - altura fija para alinear */}
                  <div className="mt-4 min-h-[3.5rem] flex items-start justify-center">
                    {member.services && member.services.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {member.services.slice(0, 3).map((service) => (
                          <Badge key={service.id} variant="secondary">
                            {service.name}
                          </Badge>
                        ))}
                        {member.services.length > 3 && (
                          <Badge variant="secondary">
                            +{member.services.length - 3} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botón - siempre al final */}
                  <div className="mt-auto pt-6">
                    <Button asChild className="w-full">
                      <Link href={`/reservar?staff=${member.id}`}>
                        Reservar con {member.name.split(" ")[0]}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
