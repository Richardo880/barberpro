import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { mockUser, mockAdmin, mockServices, mockStaff } from "@/test/mockData";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    haircutRecord: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
  },
}));

describe("GET /api/records", () => {
  const mockRecord = {
    id: "clrxyz1234567890abcdef10",
    clientId: mockUser.id,
    serviceId: mockServices[0].id,
    staffId: mockStaff[0].id,
    date: new Date("2025-01-01T10:00:00Z"),
    price: 50000,
    originalPrice: 50000,
    discountAmount: 0,
    promotionApplied: false,
    notes: "Corte normal",
    tags: ["degradado"],
    photoUrls: [],
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      imageUrl: null,
    },
    staff: {
      id: mockStaff[0].id,
      name: mockStaff[0].name,
      email: mockStaff[0].email,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns records for authenticated client (only own records)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockResolvedValue([mockRecord] as any);

    const request = new NextRequest("http://localhost:3000/api/records");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.records).toHaveLength(1);
    expect(prisma.haircutRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: mockUser.id },
      })
    );
  });

  it("returns all records for admin without clientId filter", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockResolvedValue([mockRecord] as any);

    const request = new NextRequest("http://localhost:3000/api/records");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.haircutRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it("allows admin to filter by clientId", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockResolvedValue([mockRecord] as any);

    const request = new NextRequest("http://localhost:3000/api/records?clientId=client-123");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(prisma.haircutRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: "client-123" },
      })
    );
  });

  it("orders records by date descending", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/records");
    await GET(request);

    expect(prisma.haircutRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { date: "desc" },
      })
    );
  });

  it("includes service and staff in response", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockResolvedValue([mockRecord] as any);

    const request = new NextRequest("http://localhost:3000/api/records");
    const response = await GET(request);
    const data = await response.json();

    expect(data.records[0].service).toBeDefined();
    expect(data.records[0].staff).toBeDefined();
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.haircutRecord.findMany).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/records");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});

describe("POST /api/records", () => {
  const mockStaffUser = {
    id: mockStaff[0].id,
    name: mockStaff[0].name,
    email: mockStaff[0].email,
    role: "STAFF" as const,
  };

  const validRecordData = {
    clientId: mockUser.id,
    serviceId: mockServices[0].id,
    date: "2025-01-01T10:00:00Z",
    price: 50000,
  };

  const createdRecord = {
    id: "clrxyz1234567890abcdef11",
    ...validRecordData,
    staffId: mockStaff[0].id,
    originalPrice: 50000,
    discountAmount: 0,
    promotionApplied: false,
    notes: null,
    tags: [],
    photoUrls: [],
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      imageUrl: null,
    },
    staff: {
      id: mockStaff[0].id,
      name: mockStaff[0].name,
      email: mockStaff[0].email,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 403 if client tries to create record", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockUser } as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("No autorizado");
  });

  it("returns 400 if required fields are missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify({ clientId: mockUser.id }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Faltan campos requeridos");
  });

  it("creates record successfully for admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Record creado exitosamente");
    expect(data.record).toBeDefined();
  });

  it("creates record successfully for staff", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockStaffUser } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("uses session user as staffId if not provided", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    await POST(request);

    expect(prisma.haircutRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          staffId: mockAdmin.id,
        }),
      })
    );
  });

  it("uses provided staffId when given", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify({ ...validRecordData, staffId: "custom-staff-id" }),
    });
    await POST(request);

    expect(prisma.haircutRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          staffId: "custom-staff-id",
        }),
      })
    );
  });

  it("calculates promotion fields automatically when price is discounted", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify({ ...validRecordData, price: 40000 }), // Discounted
    });
    await POST(request);

    expect(prisma.haircutRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          price: 40000,
          originalPrice: 50000,
          discountAmount: 10000,
          promotionApplied: true,
        }),
      })
    );
  });

  it("uses provided promotion fields when given", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify({
        ...validRecordData,
        price: 40000,
        originalPrice: 60000,
        discountAmount: 20000,
        promotionApplied: true,
      }),
    });
    await POST(request);

    expect(prisma.haircutRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          originalPrice: 60000,
          discountAmount: 20000,
          promotionApplied: true,
        }),
      })
    );
  });

  it("handles optional fields (notes, tags, photoUrls)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockResolvedValue(createdRecord as any);

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify({
        ...validRecordData,
        notes: "Cliente satisfecho",
        tags: ["degradado", "pompadour"],
        photoUrls: ["https://example.com/photo1.jpg"],
      }),
    });
    await POST(request);

    expect(prisma.haircutRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notes: "Cliente satisfecho",
          tags: ["degradado", "pompadour"],
          photoUrls: ["https://example.com/photo1.jpg"],
        }),
      })
    );
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: mockAdmin } as any);
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      id: mockServices[0].id,
      price: 50000,
    } as any);
    vi.mocked(prisma.haircutRecord.create).mockRejectedValue(new Error("DB error"));

    const request = new NextRequest("http://localhost:3000/api/records", {
      method: "POST",
      body: JSON.stringify(validRecordData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno del servidor");
  });
});
