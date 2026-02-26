"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  clientNotes?: string | null;
  staffNotes?: string | null;
  paymentProofUrl?: string | null;
  paymentStatus?: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number | string;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

interface AppointmentsResponse {
  appointments: Appointment[];
  total?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

interface SlotsResponse {
  slots: TimeSlot[];
}

interface AppointmentQueryParams {
  status?: string | string[];
  clientId?: string;
  staffId?: string;
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface CreateAppointmentData {
  serviceId: string;
  staffId?: string | null;
  startTime: string;
  clientNotes?: string;
  paymentProofUrl?: string;
}

interface UpdateAppointmentData {
  status?: string;
  staffId?: string | null;
  startTime?: string;
  clientNotes?: string;
  staffNotes?: string;
  paymentStatus?: string;
}

export function useAppointments(params?: AppointmentQueryParams) {
  return useQuery<AppointmentsResponse>({
    queryKey: ["appointments", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) {
        // Si es un array, unir con comas; si es string, usar directo
        const statusValue = Array.isArray(params.status)
          ? params.status.join(",")
          : params.status;
        searchParams.set("status", statusValue);
      }
      if (params?.clientId) searchParams.set("clientId", params.clientId);
      if (params?.staffId) searchParams.set("staffId", params.staffId);
      if (params?.date) searchParams.set("date", params.date);
      if (params?.from) searchParams.set("from", params.from);
      if (params?.to) searchParams.set("to", params.to);
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const response = await fetch(
        `/api/appointments?${searchParams.toString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener turnos");
      }

      return response.json();
    },
  });
}

export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener turno");
      }

      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear turno");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Turno reservado",
        description: "Tu turno ha sido reservado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentData }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar turno");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", variables.id] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cancelar turno");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Turno cancelado",
        description: "El turno ha sido cancelado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar turno");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado permanentemente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAvailableSlots(
  serviceId: string,
  date: string,
  staffId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<SlotsResponse>({
    queryKey: ["available-slots", serviceId, date, staffId],
    queryFn: async () => {
      const response = await fetch("/api/appointments/available-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId,
          date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al obtener slots disponibles");
      }

      return response.json();
    },
    enabled: options?.enabled ?? (!!serviceId && !!date),
    staleTime: 2 * 60 * 1000, // 2 minutos (slots cambian rápido)
  });
}
