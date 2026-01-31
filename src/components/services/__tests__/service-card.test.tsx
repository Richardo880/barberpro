import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceCard } from "../service-card";
import { mockServices } from "@/test/mockData";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock usePromotion hook
const mockUsePromotion = vi.fn();
vi.mock("@/hooks/use-promotion", () => ({
  usePromotion: () => mockUsePromotion(),
  getDiscountedPrice: (price: number, serviceId: string, promotion: any) => {
    if (promotion?.enabled && promotion?.serviceIds?.includes(serviceId)) {
      const discountAmount = (promotion.discountAmount || 0);
      return {
        finalPrice: Math.max(0, price - discountAmount),
        hasDiscount: true,
      };
    }
    return { finalPrice: price, hasDiscount: false };
  },
}));

const mockService = {
  id: mockServices[0].id,
  name: "Corte Clásico",
  description: "Un corte tradicional con estilo moderno",
  duration: 30,
  price: 50000,
  imageUrl: "https://example.com/corte.jpg",
  isActive: true,
};

describe("ServiceCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePromotion.mockReturnValue({ data: null });
  });

  it("renders service name", () => {
    render(<ServiceCard service={mockService} />);

    expect(screen.getByText("Corte Clásico")).toBeInTheDocument();
  });

  it("renders service description", () => {
    render(<ServiceCard service={mockService} />);

    expect(screen.getByText("Un corte tradicional con estilo moderno")).toBeInTheDocument();
  });

  it("renders service duration", () => {
    render(<ServiceCard service={mockService} />);

    expect(screen.getByText("30 minutos")).toBeInTheDocument();
  });

  it("renders service price formatted", () => {
    render(<ServiceCard service={mockService} />);

    // Price should be formatted as currency
    expect(screen.getByText(/50\.000/)).toBeInTheDocument();
  });

  it("renders service image when provided", () => {
    render(<ServiceCard service={mockService} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/corte.jpg");
    expect(img).toHaveAttribute("alt", "Corte Clásico");
  });

  it("renders placeholder when no image", () => {
    const serviceWithoutImage = { ...mockService, imageUrl: null };
    render(<ServiceCard service={serviceWithoutImage} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // Should show Scissors icon as placeholder
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  describe("public variant", () => {
    it("shows Reservar button by default", () => {
      render(<ServiceCard service={mockService} />);

      expect(screen.getByRole("link", { name: "Reservar" })).toBeInTheDocument();
    });

    it("links to booking page with service id", () => {
      render(<ServiceCard service={mockService} />);

      const link = screen.getByRole("link", { name: "Reservar" });
      expect(link).toHaveAttribute("href", `/reservar?service=${mockService.id}`);
    });

    it("does not show inactive badge", () => {
      const inactiveService = { ...mockService, isActive: false };
      render(<ServiceCard service={inactiveService} variant="public" />);

      expect(screen.queryByText("Inactivo")).not.toBeInTheDocument();
    });
  });

  describe("admin variant", () => {
    it("shows Editar button", () => {
      const onEdit = vi.fn();
      render(<ServiceCard service={mockService} variant="admin" onEdit={onEdit} />);

      expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    });

    it("calls onEdit when Editar clicked", () => {
      const onEdit = vi.fn();
      render(<ServiceCard service={mockService} variant="admin" onEdit={onEdit} />);

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      expect(onEdit).toHaveBeenCalledWith(mockService);
    });

    it("shows inactive badge for inactive services", () => {
      const inactiveService = { ...mockService, isActive: false };
      render(<ServiceCard service={inactiveService} variant="admin" />);

      expect(screen.getByText("Inactivo")).toBeInTheDocument();
    });

    it("does not show inactive badge for active services", () => {
      render(<ServiceCard service={mockService} variant="admin" />);

      expect(screen.queryByText("Inactivo")).not.toBeInTheDocument();
    });
  });

  describe("promotion display", () => {
    it("shows discounted price when promotion active", () => {
      mockUsePromotion.mockReturnValue({
        data: {
          promotion: {
            enabled: true,
            discountAmount: 10000,
            serviceIds: [mockService.id],
          },
        },
      });

      render(<ServiceCard service={mockService} />);

      // Should show both original and discounted price
      expect(screen.getByText(/50\.000/)).toBeInTheDocument();
      expect(screen.getByText(/40\.000/)).toBeInTheDocument();
    });

    it("shows promo badge when promotion active", () => {
      mockUsePromotion.mockReturnValue({
        data: {
          promotion: {
            enabled: true,
            discountAmount: 10000,
            serviceIds: [mockService.id],
          },
        },
      });

      render(<ServiceCard service={mockService} />);

      expect(screen.getByText("Promo")).toBeInTheDocument();
    });

    it("shows original price with strikethrough when promotion active", () => {
      mockUsePromotion.mockReturnValue({
        data: {
          promotion: {
            enabled: true,
            discountAmount: 10000,
            serviceIds: [mockService.id],
          },
        },
      });

      render(<ServiceCard service={mockService} />);

      const strikethroughElement = document.querySelector(".line-through");
      expect(strikethroughElement).toBeInTheDocument();
    });

    it("does not show promo when service not in promotion list", () => {
      mockUsePromotion.mockReturnValue({
        data: {
          promotion: {
            enabled: true,
            discountAmount: 10000,
            serviceIds: ["other-service-id"],
          },
        },
      });

      render(<ServiceCard service={mockService} />);

      expect(screen.queryByText("Promo")).not.toBeInTheDocument();
    });

    it("does not show promo when promotion disabled", () => {
      mockUsePromotion.mockReturnValue({
        data: {
          promotion: {
            enabled: false,
            discountAmount: 10000,
            serviceIds: [mockService.id],
          },
        },
      });

      render(<ServiceCard service={mockService} />);

      expect(screen.queryByText("Promo")).not.toBeInTheDocument();
    });
  });

  it("handles string price correctly", () => {
    const serviceWithStringPrice = { ...mockService, price: "75000" };
    render(<ServiceCard service={serviceWithStringPrice} />);

    expect(screen.getByText(/75\.000/)).toBeInTheDocument();
  });

  it("renders without description", () => {
    const serviceWithoutDescription = { ...mockService, description: null };
    render(<ServiceCard service={serviceWithoutDescription} />);

    expect(screen.getByText("Corte Clásico")).toBeInTheDocument();
    expect(screen.queryByText("Un corte tradicional")).not.toBeInTheDocument();
  });
});
