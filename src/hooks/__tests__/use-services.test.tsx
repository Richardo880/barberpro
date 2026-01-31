import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useServices,
  useServiceById,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "../use-services";
import { mockServices } from "@/test/mockData";

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

describe("useServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches active services by default", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ services: mockServices }),
    } as Response);

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ services: mockServices });
    expect(mockFetch).toHaveBeenCalledWith("/api/services?active=true");
  });

  it("fetches all services when active=false", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ services: mockServices }),
    } as Response);

    const { result } = renderHook(() => useServices({ active: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/services?active=false");
  });

  it("does not fetch when enabled=false", () => {
    const mockFetch = vi.mocked(global.fetch);

    const { result } = renderHook(() => useServices({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles API errors", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al obtener servicios" }),
    } as Response);

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Error al obtener servicios");
  });
});

describe("useServiceById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches service by id successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: mockServices[0] }),
    } as Response);

    const { result } = renderHook(() => useServiceById("service-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockServices[0]);
    expect(mockFetch).toHaveBeenCalledWith("/api/services/service-1");
  });

  it("does not fetch when id is empty", () => {
    const mockFetch = vi.mocked(global.fetch);

    const { result } = renderHook(() => useServiceById(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles service not found error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Servicio no encontrado" }),
    } as Response);

    const { result } = renderHook(() => useServiceById("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Servicio no encontrado");
  });
});

describe("useCreateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("creates service successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: mockServices[0], message: "Servicio creado" }),
    } as Response);

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    const serviceData = {
      name: "Nuevo Servicio",
      duration: 30,
      price: 50000,
    };

    await result.current.mutateAsync(serviceData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      })
    );
  });

  it("handles creation error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Datos inválidos" }),
    } as Response);

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    const serviceData = {
      name: "A",
      duration: 30,
      price: 50000,
    };

    await expect(result.current.mutateAsync(serviceData)).rejects.toThrow(
      "Datos inválidos"
    );
  });

  it("sends all optional fields", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: mockServices[0] }),
    } as Response);

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    const serviceData = {
      name: "Servicio Completo",
      description: "Descripción del servicio",
      duration: 45,
      price: 75000,
      imageUrl: "https://example.com/image.jpg",
      isActive: true,
    };

    await result.current.mutateAsync(serviceData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services",
      expect.objectContaining({
        body: JSON.stringify(serviceData),
      })
    );
  });
});

describe("useUpdateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("updates service successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: mockServices[0], message: "Servicio actualizado" }),
    } as Response);

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "service-1",
      data: { name: "Nombre Actualizado" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services/service-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nombre Actualizado" }),
      })
    );
  });

  it("handles update error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al actualizar servicio" }),
    } as Response);

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        id: "service-1",
        data: { price: -100 },
      })
    ).rejects.toThrow("Error al actualizar servicio");
  });

  it("updates multiple fields at once", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ service: mockServices[0] }),
    } as Response);

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    });

    const updateData = {
      name: "Nuevo Nombre",
      price: 80000,
      duration: 60,
      isActive: false,
    };

    await result.current.mutateAsync({
      id: "service-1",
      data: updateData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services/service-1",
      expect.objectContaining({
        body: JSON.stringify(updateData),
      })
    );
  });
});

describe("useDeleteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("deletes service successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Servicio eliminado" }),
    } as Response);

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("service-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services/service-1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("handles delete error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al eliminar servicio" }),
    } as Response);

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("service-1")).rejects.toThrow(
      "Error al eliminar servicio"
    );
  });
});
