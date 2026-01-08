"use client";

import { useQuery } from "@tanstack/react-query";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener estadísticas");
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minuto (stats cambian frecuentemente)
  });
}
