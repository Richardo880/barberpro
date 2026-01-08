"use client";

import { useServices } from "@/hooks/use-services";
import { ServiceList } from "@/components/services/service-list";
import { PageHeader } from "@/components/shared/page-header";

export default function ServicesPage() {
  const { data: servicesData, isLoading } = useServices();
  const services = servicesData?.services || [];

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Nuestros Servicios"
        subtitle="Ofrecemos una amplia gama de servicios de barbería profesional"
      />

      <div className="mt-12">
        <ServiceList
          services={services}
          variant="public"
          loading={isLoading}
        />
      </div>
    </div>
  );
}
