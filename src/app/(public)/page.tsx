"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ServiceList } from "@/components/services/service-list";
import { useServices } from "@/hooks/use-services";
import { useStaff } from "@/hooks/use-staff";
import { useInView } from "@/hooks/use-in-view";
import { Calendar, Clock, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function ServicesSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { data: servicesData, isLoading: servicesLoading } = useServices({
    enabled: isInView,
  });

  const services = servicesData?.services?.slice(0, 3) || [];

  return (
    <section
      ref={ref}
      className="relative bg-[url('/images/menu/background3.jpg')] bg-cover bg-center bg-fixed py-16 sm:py-24 transition-all duration-700 ease-in-out"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-12 text-center mx-auto max-w-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-stone-700/40 ${
            isInView ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-stone-100">
            Nuestros Servicios
          </h2>
          <p className="mt-4 text-lg font-semibold leading-8 text-stone-200">
            Lo mejor en cortes y cuidado personal
          </p>
        </div>

        <div className={isInView ? "animate-fade-in-up animate-delay-200" : "opacity-0"}>
          <ServiceList
            services={services}
            variant="public"
            loading={!isInView || servicesLoading}
          />
        </div>

        {services.length > 0 && (
          <div className={`mt-12 text-center ${isInView ? "animate-fade-in-up animate-delay-300" : "opacity-0"}`}>
            <Button variant="outline" asChild>
              <Link href="/servicios">Ver todos los servicios</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const features = [
    { icon: Calendar, title: "Reserva Online", description: "24/7 desde cualquier lugar" },
    { icon: Users, title: "Profesionales", description: "Barberos certificados" },
    { icon: Award, title: "Calidad Premium", description: "Productos de primera" },
    { icon: Clock, title: "Puntualidad", description: "Respetamos tu tiempo" },
  ];

  return (
    <section
      ref={ref}
      className="relative bg-[url('/images/menu/bgmedio.png')] bg-cover bg-center bg-fixed items-center py-16 sm:py-24 transition-all duration-700 ease-in-out"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border-stone-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                isInView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: isInView ? `${index * 100}ms` : undefined }}
            >
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-700/30 shadow-inner">
                  <feature.icon className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="mt-4 font-semibold text-stone-100">{feature.title}</h3>
                <p className="mt-2 text-sm text-stone-300/90">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function StaffSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { data: staffData, isLoading: staffLoading } = useStaff({
    enabled: isInView,
  });

  const staff = staffData?.staff?.slice(0, 3) || [];
  const showLoading = !isInView || staffLoading;

  return (
    <section
      ref={ref}
      className="relative bg-[url('/images/menu/bg-image.png')] bg-cover bg-center bg-fixed py-16 sm:py-24 transition-all duration-700 ease-in-out"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-12 text-center mx-auto max-w-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-stone-700/40 ${
            isInView ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-stone-100">
            Nuestro Equipo
          </h2>
          <p className="mt-4 text-lg text-stone-200">
            Conoce a nuestros profesionales
          </p>
        </div>

        {showLoading ? (
          <div className={`flex flex-wrap justify-center gap-8 ${isInView ? "animate-fade-in-up animate-delay-200" : "opacity-0"}`}>
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] overflow-hidden bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border-stone-700/40"
              >
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="mx-auto h-24 w-24 rounded-full bg-stone-800/50" />
                    <div className="h-4 w-32 rounded bg-stone-800/50 mx-auto" />
                    <div className="h-3 w-full rounded bg-stone-800/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8">
            {staff.map((member, index) => (
              <Card
                key={member.id}
                className={`w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] overflow-hidden bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border-stone-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  isInView ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <Avatar className="mx-auto h-24 w-24 border-4 border-yellow-700/50 shadow-lg">
                    <AvatarImage src={member.photoUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-yellow-800 text-yellow-50">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 font-semibold text-stone-100">{member.name}</h3>
                  {member.bio && (
                    <p className="mt-2 text-sm text-stone-300/90 line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {staff.length > 0 && (
          <div className={`mt-12 text-center ${isInView ? "animate-fade-in-up animate-delay-300" : "opacity-0"}`}>
            <Button
              variant="outline"
              asChild
              className="border-stone-700 text-stone-300/90 hover:bg-stone-300 shadow-md"
            >
              <Link href="/barberos">Ver todo el equipo</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function CTASection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 py-16 sm:py-24 transition-all duration-700 ease-in-out"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMiAyLTQgNC00czQgMiA0IDQtMiA0LTQgNC00LTItNC00em0wIDQwYzAtMiAyLTQgNC00czQgMiA0IDQtMiA0LTQgNC00LTItNC00em0wLTIwYzAtMiAyLTQgNC00czQgMiA0IDQtMiA0LTQgNC00LTItNC00ek0xNiA0NGMwLTIgMi00IDQtNHM0IDIgNCA0LTIgNC00IDQtNC0yLTQtNHptMC00MGMwLTIgMi00IDQtNHM0IDIgNCA0LTIgNC00IDQtNC0yLTQtNHptMCAyMGMwLTIgMi00IDQtNHM0IDIgNCA0LTIgNC00IDQtNC0yLTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

      <div
        className={`relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 ${
          isInView ? "animate-fade-in-up" : "opacity-0"
        }`}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-stone-100">
          ¿Listo para tu próximo corte?
        </h2>
        <p className="mt-4 text-lg text-stone-200">
          Reserva tu turno ahora y déjanos cuidar de tu estilo
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            asChild
            className="bg-yellow-700 hover:bg-yellow-800 text-yellow-50 shadow-2xl hover:shadow-yellow-700/50 transition-all duration-300 hover:scale-105"
          >
            <Link href="/reservar">Reservar Ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Minimalista */}
      <section className="relative bg-[url('/images/menu/background.jpg')] bg-cover bg-center bg-fixed py-24 sm:py-32 transition-all duration-700 ease-in-out">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl text-center p-6">
            <div className="animate-[fadeInScale_0.8s_ease-out_forwards]">
              <Image
                src="/images/menu/logo.jpeg"
                alt="Imperio Barbería - Desde 2019"
                width={180}
                height={180}
                className="mx-auto rounded-full shadow-2xl border-4 border-yellow-700/50"
                priority
                unoptimized
              />
            </div>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="bg-yellow-700 hover:bg-yellow-800 text-yellow-50 shadow-lg"
              >
                <Link href="/reservar">Reservar Turno</Link>
              </Button>
              <Button
                size="lg"
                
                asChild
                className="bg-yellow-700 hover:bg-yellow-800 text-yellow-50 shadow-lg"
              >
                <Link href="/servicios">Ver Servicios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ServicesSection />
      <FeaturesSection />
      <StaffSection />
      <CTASection />
    </div>
  );
}
