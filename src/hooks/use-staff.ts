"use client";

import { useQuery } from "@tanstack/react-query";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  specialties?: string[];
  isActive?: boolean;
  services?: { id: string; name: string }[];
}

interface StaffResponse {
  staff: StaffMember[];
}

export function useStaff() {
  return useQuery<StaffResponse>({
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
  return useQuery<StaffMember>({
    queryKey: ["staff", id],
    queryFn: async () => {
      const response = await fetch("/api/staff");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener staff");
      }

      const data: StaffResponse = await response.json();
      const staffMember = data.staff.find((s) => s.id === id);

      if (!staffMember) {
        throw new Error("Staff no encontrado");
      }

      return staffMember;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
