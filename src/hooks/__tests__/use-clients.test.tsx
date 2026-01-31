import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useClients,
  useClientById,
  useUpdateClientProfile,
} from "../use-clients";
import { mockUser } from "@/test/mockData";

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

const mockClient = {
  id: mockUser.id,
  name: mockUser.name,
  email: mockUser.email,
  phone: "+595991234567",
  createdAt: "2024-01-15T10:00:00Z",
  _count: { appointments: 5 },
  clientProfile: {
    internalNotes: "Cliente frecuente",
    tags: ["vip", "puntual"],
    preferredStaffId: null,
  },
};

describe("useClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches clients successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        clients: [mockClient],
        pagination: { total: 1, page: 1, limit: 10 },
      }),
    } as Response);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.clients).toHaveLength(1);
    expect(result.current.data?.clients[0].name).toBe(mockUser.name);
  });

  it("passes search parameter correctly", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clients: [], pagination: { total: 0, page: 1, limit: 10 } }),
    } as Response);

    const { result } = renderHook(() => useClients({ search: "juan" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callArg = mockFetch.mock.calls[0][0];
    expect(callArg).toContain("search=juan");
  });

  it("passes pagination parameters correctly", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clients: [], pagination: { total: 50, page: 2, limit: 20 } }),
    } as Response);

    const { result } = renderHook(() => useClients({ page: 2, limit: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callArg = mockFetch.mock.calls[0][0];
    expect(callArg).toContain("page=2");
    expect(callArg).toContain("limit=20");
  });

  it("handles API errors", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al obtener clientes" }),
    } as Response);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Error al obtener clientes");
  });

  it("handles unauthorized access error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No autorizado" }),
    } as Response);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("No autorizado");
  });
});

describe("useClientById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches client by id successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient }),
    } as Response);

    const { result } = renderHook(() => useClientById("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClient);
    expect(mockFetch).toHaveBeenCalledWith("/api/clients/client-1");
  });

  it("does not fetch when id is empty", () => {
    const mockFetch = vi.mocked(global.fetch);

    const { result } = renderHook(() => useClientById(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles client not found error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Cliente no encontrado" }),
    } as Response);

    const { result } = renderHook(() => useClientById("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Cliente no encontrado");
  });

  it("includes client profile data in response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient }),
    } as Response);

    const { result } = renderHook(() => useClientById("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.clientProfile).toBeDefined();
    expect(result.current.data?.clientProfile?.tags).toContain("vip");
  });
});

describe("useUpdateClientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("updates client profile successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient, message: "Cliente actualizado" }),
    } as Response);

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      clientId: "client-1",
      data: { internalNotes: "Notas actualizadas" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/clients/client-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: "Notas actualizadas" }),
      })
    );
  });

  it("updates tags successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient }),
    } as Response);

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      clientId: "client-1",
      data: { tags: ["vip", "nuevo"] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/clients/client-1",
      expect.objectContaining({
        body: JSON.stringify({ tags: ["vip", "nuevo"] }),
      })
    );
  });

  it("updates preferredStaffId successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient }),
    } as Response);

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      clientId: "client-1",
      data: { preferredStaffId: "staff-1" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/clients/client-1",
      expect.objectContaining({
        body: JSON.stringify({ preferredStaffId: "staff-1" }),
      })
    );
  });

  it("handles update error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al actualizar cliente" }),
    } as Response);

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        clientId: "client-1",
        data: { internalNotes: "Test" },
      })
    ).rejects.toThrow("Error al actualizar cliente");
  });

  it("updates multiple fields at once", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ client: mockClient }),
    } as Response);

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    const updateData = {
      internalNotes: "Notas nuevas",
      tags: ["premium"],
      preferredStaffId: "staff-2",
    };

    await result.current.mutateAsync({
      clientId: "client-1",
      data: updateData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/clients/client-1",
      expect.objectContaining({
        body: JSON.stringify(updateData),
      })
    );
  });
});
