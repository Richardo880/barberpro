"use client";

import { useQuery } from "@tanstack/react-query";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await fetch("/api/staff");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener staff");
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (staff cambia poco)
  });
}

export function useStaffById(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: async () => {
      const response = await fetch("/api/staff");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener staff");
      }

      const data = await response.json();
      const staffMember = data.staff.find((s: any) => s.id === id);

      if (!staffMember) {
        throw new Error("Staff no encontrado");
      }

      return staffMember;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
