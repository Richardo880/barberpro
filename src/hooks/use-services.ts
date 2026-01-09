"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number | string;
  imageUrl?: string | null;
  isActive?: boolean;
}

interface ServicesResponse {
  services: Service[];
}

interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  imageUrl?: string;
  isActive?: boolean;
}

interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export function useServices(active = true) {
  return useQuery<ServicesResponse>({
    queryKey: ["services", { active }],
    queryFn: async () => {
      const response = await fetch(
        `/api/services?active=${active.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener servicios");
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (servicios cambian poco)
  });
}

export function useServiceById(id: string) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: async () => {
      const response = await fetch(`/api/services/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener servicio");
      }

      const data = await response.json();
      return data.service;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear servicio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceData }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar servicio");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", variables.id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar servicio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
