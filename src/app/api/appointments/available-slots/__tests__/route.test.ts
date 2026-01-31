import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// Create mock function outside
const mockGetAvailableSlots = vi.fn();

// Mock the AvailabilityService as a class
vi.mock("@/server/services/availability.service", () => ({
  AvailabilityService: class MockAvailabilityService {
    getAvailableSlots = mockGetAvailableSlots;
    validateSlot = vi.fn();
    getNextAvailableSlots = vi.fn();
  },
}));

describe("POST /api/appointments/available-slots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available slots for valid request", async () => {
    const mockSlots = [
      {
        start: new Date("2025-01-01T12:00:00Z"),
        end: new Date("2025-01-01T12:30:00Z"),
        available: true,
      },
      {
        start: new Date("2025-01-01T12:30:00Z"),
        end: new Date("2025-01-01T13:00:00Z"),
        available: true,
      },
      {
        start: new Date("2025-01-01T13:00:00Z"),
        end: new Date("2025-01-01T13:30:00Z"),
        available: false,
      },
    ];

    mockGetAvailableSlots.mockResolvedValue(mockSlots);

    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.slots).toHaveLength(3);
    expect(data.slots[0]).toEqual({
      time: "12:00",
      start: "2025-01-01T12:00:00.000Z",
      end: "2025-01-01T12:30:00.000Z",
      available: true,
    });
    expect(data.slots[2].available).toBe(false);
  });

  it("passes staffId to service when provided", async () => {
    mockGetAvailableSlots.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
        staffId: "clrxyz1234567890abcdef02",
        date: "2025-01-01",
      }),
    });

    await POST(request);

    expect(mockGetAvailableSlots).toHaveBeenCalledWith({
      serviceId: "clrxyz1234567890abcdef01",
      staffId: "clrxyz1234567890abcdef02",
      date: "2025-01-01",
    });
  });

  it("returns 400 for missing serviceId", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 for missing date", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 for invalid date format", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
        date: "01-01-2025", // Wrong format
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 400 for invalid serviceId (not CUID)", async () => {
    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "invalid-id",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Datos inválidos");
  });

  it("returns 500 when service throws error", async () => {
    mockGetAvailableSlots.mockRejectedValue(new Error("Servicio no encontrado"));

    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error al obtener horarios disponibles");
    expect(data.message).toBe("Servicio no encontrado");
  });

  it("returns empty slots array when no slots available", async () => {
    mockGetAvailableSlots.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/appointments/available-slots", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "clrxyz1234567890abcdef01",
        date: "2025-01-01",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.slots).toEqual([]);
  });
});
