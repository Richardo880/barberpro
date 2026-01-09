"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface RecordQueryParams {
  clientId?: string;
}

interface CreateRecordData {
  clientId: string;
  serviceId: string;
  staffId?: string;
  date: string; // ISO date string
  price: number;
  notes?: string;
  tags?: string[];
  photoUrls?: string[];
}

interface UpdateRecordData {
  serviceId?: string;
  date?: string;
  price?: number;
  notes?: string;
  tags?: string[];
  photoUrls?: string[];
}

export function useRecords(params?: RecordQueryParams) {
  return useQuery({
    queryKey: ["records", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.clientId) searchParams.set("clientId", params.clientId);

      const response = await fetch(`/api/records?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener historial");
      }

      return response.json();
    },
  });
}

export function useRecordById(id: string) {
  return useQuery({
    queryKey: ["records", id],
    queryFn: async () => {
      const response = await fetch(`/api/records/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener record");
      }

      const data = await response.json();
      return data.record;
    },
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecordData) => {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear record");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecordData }) => {
      const response = await fetch(`/api/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar record");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["records", variables.id] });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/records/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar record");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
