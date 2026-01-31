import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useRecords,
  useRecordById,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
} from "../use-records";
import { mockServices, mockStaff, mockUser } from "@/test/mockData";

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

const mockRecord = {
  id: "record-1",
  clientId: mockUser.id,
  serviceId: mockServices[0].id,
  staffId: mockStaff[0].id,
  date: "2024-03-15T10:00:00Z",
  price: 50000,
  notes: "Cliente satisfecho",
  tags: ["regular"],
  photoUrls: [],
  service: mockServices[0],
  staff: mockStaff[0],
};

describe("useRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches records successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [mockRecord] }),
    } as Response);

    const { result } = renderHook(() => useRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.records).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/records?");
  });

  it("passes clientId parameter correctly", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [mockRecord] }),
    } as Response);

    const { result } = renderHook(() => useRecords({ clientId: "client-1" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callArg = mockFetch.mock.calls[0][0];
    expect(callArg).toContain("clientId=client-1");
  });

  it("handles API errors", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al obtener historial" }),
    } as Response);

    const { result } = renderHook(() => useRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Error al obtener historial");
  });

  it("handles unauthorized access error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No autorizado" }),
    } as Response);

    const { result } = renderHook(() => useRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("No autorizado");
  });
});

describe("useRecordById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetches record by id successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useRecordById("record-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRecord);
    expect(mockFetch).toHaveBeenCalledWith("/api/records/record-1");
  });

  it("does not fetch when id is empty", () => {
    const mockFetch = vi.mocked(global.fetch);

    const { result } = renderHook(() => useRecordById(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles record not found error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Record no encontrado" }),
    } as Response);

    const { result } = renderHook(() => useRecordById("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Record no encontrado");
  });

  it("includes service and staff in response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useRecordById("record-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.service).toBeDefined();
    expect(result.current.data?.staff).toBeDefined();
  });
});

describe("useCreateRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("creates record successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord, message: "Record creado" }),
    } as Response);

    const { result } = renderHook(() => useCreateRecord(), {
      wrapper: createWrapper(),
    });

    const recordData = {
      clientId: "client-1",
      serviceId: "service-1",
      date: "2024-03-15T10:00:00Z",
      price: 50000,
    };

    await result.current.mutateAsync(recordData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      })
    );
  });

  it("handles creation error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Datos inválidos" }),
    } as Response);

    const { result } = renderHook(() => useCreateRecord(), {
      wrapper: createWrapper(),
    });

    const recordData = {
      clientId: "client-1",
      serviceId: "service-1",
      date: "2024-03-15T10:00:00Z",
      price: 50000,
    };

    await expect(result.current.mutateAsync(recordData)).rejects.toThrow(
      "Datos inválidos"
    );
  });

  it("sends all optional fields", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useCreateRecord(), {
      wrapper: createWrapper(),
    });

    const recordData = {
      clientId: "client-1",
      serviceId: "service-1",
      staffId: "staff-1",
      date: "2024-03-15T10:00:00Z",
      price: 50000,
      notes: "Notas del corte",
      tags: ["regular", "vip"],
      photoUrls: ["https://example.com/photo.jpg"],
    };

    await result.current.mutateAsync(recordData);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records",
      expect.objectContaining({
        body: JSON.stringify(recordData),
      })
    );
  });

  it("handles unauthorized error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No autorizado" }),
    } as Response);

    const { result } = renderHook(() => useCreateRecord(), {
      wrapper: createWrapper(),
    });

    const recordData = {
      clientId: "client-1",
      serviceId: "service-1",
      date: "2024-03-15T10:00:00Z",
      price: 50000,
    };

    await expect(result.current.mutateAsync(recordData)).rejects.toThrow(
      "No autorizado"
    );
  });
});

describe("useUpdateRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("updates record successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord, message: "Record actualizado" }),
    } as Response);

    const { result } = renderHook(() => useUpdateRecord(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "record-1",
      data: { notes: "Notas actualizadas" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records/record-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Notas actualizadas" }),
      })
    );
  });

  it("updates tags successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useUpdateRecord(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "record-1",
      data: { tags: ["vip", "premium"] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records/record-1",
      expect.objectContaining({
        body: JSON.stringify({ tags: ["vip", "premium"] }),
      })
    );
  });

  it("updates photoUrls successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useUpdateRecord(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: "record-1",
      data: { photoUrls: ["https://example.com/new-photo.jpg"] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records/record-1",
      expect.objectContaining({
        body: JSON.stringify({ photoUrls: ["https://example.com/new-photo.jpg"] }),
      })
    );
  });

  it("handles update error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al actualizar record" }),
    } as Response);

    const { result } = renderHook(() => useUpdateRecord(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        id: "record-1",
        data: { notes: "Test" },
      })
    ).rejects.toThrow("Error al actualizar record");
  });

  it("updates multiple fields at once", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: mockRecord }),
    } as Response);

    const { result } = renderHook(() => useUpdateRecord(), {
      wrapper: createWrapper(),
    });

    const updateData = {
      notes: "Notas nuevas",
      tags: ["updated"],
      price: 60000,
    };

    await result.current.mutateAsync({
      id: "record-1",
      data: updateData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records/record-1",
      expect.objectContaining({
        body: JSON.stringify(updateData),
      })
    );
  });
});

describe("useDeleteRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("deletes record successfully", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Record eliminado" }),
    } as Response);

    const { result } = renderHook(() => useDeleteRecord(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync("record-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/records/record-1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("handles delete error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error al eliminar record" }),
    } as Response);

    const { result } = renderHook(() => useDeleteRecord(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("record-1")).rejects.toThrow(
      "Error al eliminar record"
    );
  });

  it("handles unauthorized delete error", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "No autorizado" }),
    } as Response);

    const { result } = renderHook(() => useDeleteRecord(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync("record-1")).rejects.toThrow(
      "No autorizado"
    );
  });
});
