"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceList } from "@/components/services/service-list";
import { useServices } from "@/hooks/use-services";
import { useStaff } from "@/hooks/use-staff";
import { Calendar, Clock, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function HomePage() {
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: staffData, isLoading: staffLoading } = useStaff();

  const services = servicesData?.services?.slice(0, 3) || [];
  const staff = staffData?.staff?.slice(0, 3) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Minimalista */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Tu estilo,
              <br />
              <span className="text-primary">nuestro compromiso</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Reserva tu turno en segundos con los mejores profesionales
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/reservar">Reservar Turno</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/servicios">Ver Servicios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Simple y limpio */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Reserva Online</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  24/7 desde cualquier lugar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Profesionales</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Barberos certificados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Calidad Premium</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Productos de primera
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Puntualidad</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Respetamos tu tiempo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview - Solo 3 servicios */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nuestros Servicios
            </h2>
            <p className="mt-4 text-muted-foreground">
              Lo mejor en cortes y cuidado personal
            </p>
          </div>

          <ServiceList
            services={services}
            variant="public"
            loading={servicesLoading}
          />

          {services.length > 0 && (
            <div className="mt-12 text-center">
              <Button variant="outline" asChild>
                <Link href="/servicios">Ver todos los servicios</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Staff Preview - Solo 3 barberos */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nuestro Equipo
            </h2>
            <p className="mt-4 text-muted-foreground">
              Conoce a nuestros profesionales
            </p>
          </div>

          {staffLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="mx-auto h-24 w-24 rounded-full bg-muted" />
                      <div className="h-4 w-32 rounded bg-muted mx-auto" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Avatar className="mx-auto h-24 w-24">
                      <AvatarImage src={member.photoUrl || undefined} />
                      <AvatarFallback className="text-2xl">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-semibold">{member.name}</h3>
                    {member.bio && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {member.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {staff.length > 0 && (
            <div className="mt-12 text-center">
              <Button variant="outline" asChild>
                <Link href="/barberos">Ver todo el equipo</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final - Simple */}
      <section className="bg-primary py-16 text-primary-foreground sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90">
            Reserva tu turno ahora y déjanos cuidar de tu estilo
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/reservar">Reservar Ahora</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
