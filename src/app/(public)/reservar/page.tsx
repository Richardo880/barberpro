"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function ReservarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Redirect to login with callback URL
      const params = new URLSearchParams();
      params.set("callbackUrl", `/reservar?${searchParams.toString()}`);
      router.push(`/login?${params.toString()}`);
    } else {
      // Redirect to booking wizard with query params
      router.push(`/mi-cuenta/nueva-reserva?${searchParams.toString()}`);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">
          Redirigiendo...
        </p>
      </div>
    </div>
  );
}

export default function ReservarPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            Cargando...
          </p>
        </div>
      </div>
    }>
      <ReservarContent />
    </Suspense>
  );
}
