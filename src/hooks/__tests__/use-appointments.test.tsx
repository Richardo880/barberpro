import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAppointments,
  useCreateAppointment,
  useCancelAppointment,
  useAvailableSlots,
} from "../use-appointments";
import { mockAppointment, mockAvailableSlots } from "@/test/mockData";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
}

describe("useAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches appointments successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: [mockAppointment], total: 1 }),
    } as Response);

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      appointments: [mockAppointment],
      total: 1,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/appointments")
    );
  });

  it("passes query parameters correctly", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: [], total: 0 }),
    } as Response);

    const { result } = renderHook(
      () =>
        useAppointments({
          status: "PENDING",
          from: "2024-01-01",
          to: "2024-12-31",
          page: 1,
          limit: 10,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callArg = mockFetch.mock.calls[0][0];
    expect(callArg).toContain("status=PENDING");
    expect(callArg).toContain("from=2024-01-01");
    expect(callArg).toContain("to=2024-12-31");
  });

  it("handles API errors", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al obtener turnos" }),
    } as Response);

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("creates appointment successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointment: mockAppointment }),
    } as Response);

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    });

    const appointmentData = {
      serviceId: "service-1",
      staffId: "staff-1",
      startTime: new Date().toISOString(),
      clientNotes: "Test notes",
    };

    await result.current.mutateAsync(appointmentData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/appointments",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      })
    );
  });

  it("handles appointment creation error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "El horario no está disponible" }),
    } as Response);

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    });

    const appointmentData = {
      serviceId: "service-1",
      startTime: new Date().toISOString(),
    };

    await expect(result.current.mutateAsync(appointmentData)).rejects.toThrow(
      "El horario no está disponible"
    );
  });

  it("sends appointment without optional fields", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointment: mockAppointment }),
    } as Response);

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    });

    const appointmentData = {
      serviceId: "service-1",
      startTime: new Date().toISOString(),
    };

    await result.current.mutateAsync(appointmentData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/appointments",
      expect.objectContaining({
        body: JSON.stringify(appointmentData),
      })
    );
  });
});

describe("useCancelAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("cancels appointment successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        appointment: { ...mockAppointment, status: "CANCELLED" },
      }),
    } as Response);

    const { result } = renderHook(() => useCancelAppointment(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("appointment-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/appointments/appointment-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
    );
  });

  it("handles cancellation error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No se puede cancelar este turno" }),
    } as Response);

    const { result } = renderHook(() => useCancelAppointment(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("appointment-1")).rejects.toThrow(
      "No se puede cancelar este turno"
    );
  });
});

describe("useAvailableSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches available slots successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailableSlots,
    } as Response);

    const params = {
      serviceId: "service-1",
      date: "2024-03-15",
      staffId: "staff-1",
    };

    const { result } = renderHook(() => useAvailableSlots(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAvailableSlots);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/appointments/available-slots",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
    );
  });

  it("does not fetch when required params are missing", () => {
    const mockFetch = vi.mocked(global.fetch);

    const { result } = renderHook(
      () =>
        useAvailableSlots({
          serviceId: "",
          date: "",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles slots fetch error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al obtener horarios" }),
    } as Response);

    const params = {
      serviceId: "service-1",
      date: "2024-03-15",
    };

    const { result } = renderHook(() => useAvailableSlots(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("includes optional staffId in request", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailableSlots,
    } as Response);

    const params = {
      serviceId: "service-1",
      staffId: "staff-1",
      date: "2024-03-15",
    };

    const { result } = renderHook(() => useAvailableSlots(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/appointments/available-slots",
      expect.objectContaining({
        body: JSON.stringify(params),
      })
    );
  });
});
