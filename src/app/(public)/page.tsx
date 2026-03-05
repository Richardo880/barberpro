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
          className={`mb-12 text-center mx-auto max-w-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-stone-700/40 ${isInView ? "animate-fade-in-up" : "opacity-0"
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
              className={`bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border-stone-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${isInView ? "animate-fade-in-up" : "opacity-0"
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
          className={`mb-12 text-center mx-auto max-w-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-stone-700/40 ${isInView ? "animate-fade-in-up" : "opacity-0"
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
                className={`w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] overflow-hidden bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border-stone-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${isInView ? "animate-fade-in-up" : "opacity-0"
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

function LocationSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="relative bg-[url('/images/menu/front.jpeg')] bg-cover bg-center bg-fixed py-16 sm:py-24 transition-all duration-700 ease-in-out"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-12 text-center mx-auto max-w-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-stone-700/40 ${isInView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-stone-100">
            Visitanos
          </h2>
          <p className="mt-4 text-lg text-stone-200">
            Conocé nuestro espacio
          </p>
        </div>

        {/* Photos row: 3 columns on desktop, stacked on mobile */}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isInView ? "animate-fade-in-up animate-delay-200" : "opacity-0"}`}>
          <div className="relative overflow-hidden rounded-xl border border-stone-700/40 shadow-lg aspect-[4/3]">
            <Image
              src="/images/menu/front.jpeg"
              alt="Fachada de Barbería Imperio"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-stone-700/40 shadow-lg aspect-[4/3]">
            <Image
              src="/images/menu/inside1.jpeg"
              alt="Interior de Barbería Imperio"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-stone-700/40 shadow-lg aspect-[4/3] sm:col-span-2 lg:col-span-1">
            <Image
              src="/images/menu/inside2.jpeg"
              alt="Interior de Barbería Imperio"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Map + Instagram row */}
        <div className={`mt-8 grid gap-4 lg:grid-cols-3 ${isInView ? "animate-fade-in-up animate-delay-300" : "opacity-0"}`}>
          <div className="overflow-hidden rounded-xl border border-stone-700/40 shadow-lg lg:col-span-2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.5!2d-57.5281079!3d-25.3029776!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945daf17a6b87c33%3A0x23857ff0ce48c8fc!2z!5e0!3m2!1ses!2spy!4v1700000000000"
              width="100%"
              height="280"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
              title="Ubicación de Barbería Imperio"
            />
          </div>
          <a
            href="https://www.instagram.com/barberia_imperio_0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-stone-900/85 to-stone-950/85 backdrop-blur-sm border border-stone-700/40 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
          >
            <svg
              className="h-10 w-10 text-yellow-600 group-hover:text-yellow-500 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="text-xl font-semibold text-stone-100 group-hover:text-yellow-500 transition-colors">
              @barberia_imperio_0
            </span>
            <p className="text-sm text-stone-400 text-center">
              Seguinos para ver nuestros trabajos
            </p>
          </a>
        </div>
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
        className={`relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 ${isInView ? "animate-fade-in-up" : "opacity-0"
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
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-stone-100 drop-shadow-lg">
              Barbería Imperio
            </h1>
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
      <LocationSection />
      <CTASection />
    </div>
  );
}
