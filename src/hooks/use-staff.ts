"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  specialties?: string[];
  isActive?: boolean;
  services?: { id: string; name: string; duration?: number; price?: number }[];
  staffProfileId?: string | null;
}

interface StaffResponse {
  staff: StaffMember[];
}

export interface CreateStaffData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  specialties?: string[];
  serviceIds?: string[];
}

export interface UpdateStaffData {
  name?: string;
  phone?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  specialties?: string[];
  serviceIds?: string[];
  isActive?: boolean;
}

export function useStaff(includeInactive = false) {
  return useQuery<StaffResponse>({
    queryKey: ["staff", { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive) {
        params.set("includeInactive", "true");
      }

      const url = `/api/staff${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

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
  return useQuery<{ staff: StaffMember }>({
    queryKey: ["staff", id],
    queryFn: async () => {
      const response = await fetch(`/api/staff/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener staff");
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffData) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear staff");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStaffData }) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar staff");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar staff");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
