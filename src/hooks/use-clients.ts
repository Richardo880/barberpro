"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ClientQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface UpdateClientProfileData {
  internalNotes?: string;
  tags?: string[];
  preferredStaffId?: string | null;
}

export function useClients(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const response = await fetch(`/api/clients?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener clientes");
      }

      return response.json();
    },
  });
}

export function useClientById(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener cliente");
      }

      const data = await response.json();
      return data.client;
    },
    enabled: !!id,
  });
}

export function useUpdateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: UpdateClientProfileData }) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar cliente");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", variables.clientId] });
    },
  });
}
