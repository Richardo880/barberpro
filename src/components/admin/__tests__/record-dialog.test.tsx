import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { RecordDialog } from "../record-dialog";
import { mockServices } from "@/test/mockData";

// Mock Radix Select with native HTML select (Radix doesn't work in jsdom)
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children, disabled }: any) => (
    <select
      data-testid="service-select"
      value={value || ""}
      disabled={disabled}
      onChange={(e: any) => onValueChange(e.target.value)}
    >
      <option value="">Selecciona un servicio</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock usePromotion hook with actual getDiscountedPrice logic
const mockUsePromotion = vi.fn();
vi.mock("@/hooks/use-promotion", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-promotion")>(
    "@/hooks/use-promotion"
  );
  return {
    ...actual,
    usePromotion: () => mockUsePromotion(),
  };
});

// Mock useServices hook
vi.mock("@/hooks/use-services", () => ({
  useServices: () => ({
    data: { services: mockServices },
    isLoading: false,
  }),
}));

// Mock useCreateRecord and useUpdateRecord
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
vi.mock("@/hooks/use-records", () => ({
  useCreateRecord: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateRecord: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

const promoConfig = {
  enabled: true,
  day: 3, // Wednesday
  discount: 10000,
  message: "¡Miércoles de Promo!",
  serviceIds: [mockServices[0].id],
};

// Helpers
function selectService(serviceId: string) {
  const select = screen.getByTestId("service-select");
  fireEvent.change(select, { target: { value: serviceId } });
}

function changeDate(dateValue: string) {
  const dateInput = screen.getByLabelText(/fecha/i);
  fireEvent.change(dateInput, { target: { value: dateValue } });
}

describe("RecordDialog - Promotion Price Calculation", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    clientId: "client-1",
    clientName: "Juan Pérez",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({ id: "record-1" });
    mockUsePromotion.mockReturnValue({
      data: { promotion: promoConfig },
    });
  });

  it("renders the dialog when open", () => {
    render(<RecordDialog {...defaultProps} />);
    expect(screen.getByText("Registrar Corte Realizado")).toBeInTheDocument();
  });

  it("auto-fills discounted price when selecting service on promo day (Wednesday)", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[0].id);

    const priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(40000);
  });

  it("auto-fills original price when selecting service on non-promo day", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-02"); // Thursday
    selectService(mockServices[0].id);

    const priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(50000);
  });

  it("shows promo badge when service is eligible and date is promo day", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[0].id);

    expect(screen.getByText("Promo aplicada")).toBeInTheDocument();
  });

  it("does NOT show promo badge for non-eligible service on promo day", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[1].id); // Corte + Barba (NOT in promo)

    expect(screen.queryByText("Promo aplicada")).not.toBeInTheDocument();
  });

  it("does NOT show promo badge on non-promo day even for eligible service", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-02"); // Thursday
    selectService(mockServices[0].id);

    expect(screen.queryByText("Promo aplicada")).not.toBeInTheDocument();
  });

  it("recalculates price when date changes from non-promo to promo day", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-02"); // Thursday
    selectService(mockServices[0].id);

    let priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(50000);

    changeDate("2025-01-01"); // Wednesday
    priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(40000);
  });

  it("recalculates price when date changes from promo to non-promo day", () => {
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[0].id);

    let priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(40000);

    changeDate("2025-01-02"); // Thursday
    priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(50000);
  });

  it("sends promotion fields when submitting on promo day", async () => {
    const user = userEvent.setup();
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[0].id);

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "client-1",
          serviceId: mockServices[0].id,
          price: 40000,
          originalPrice: 50000,
          discountAmount: 10000,
          promotionApplied: true,
        })
      );
    });
  });

  it("sends no promotion when submitting on non-promo day", async () => {
    const user = userEvent.setup();
    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-02"); // Thursday
    selectService(mockServices[0].id);

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 50000,
          originalPrice: 50000,
          discountAmount: 0,
          promotionApplied: false,
        })
      );
    });
  });

  it("does not apply promo when promotion data is not available", () => {
    mockUsePromotion.mockReturnValue({ data: null });

    render(<RecordDialog {...defaultProps} />);

    changeDate("2025-01-01"); // Wednesday
    selectService(mockServices[0].id);

    const priceInput = screen.getByLabelText(/precio/i) as HTMLInputElement;
    expect(Number(priceInput.value)).toBe(50000);
    expect(screen.queryByText("Promo aplicada")).not.toBeInTheDocument();
  });

  it("shows validation errors when submitting without required fields", async () => {
    const user = userEvent.setup();
    render(<RecordDialog {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await user.click(submitButton);

    expect(screen.getByText("Debes seleccionar un servicio")).toBeInTheDocument();
  });

  it("renders date input with today's date by default", () => {
    render(<RecordDialog {...defaultProps} />);
    const dateInput = screen.getByLabelText(/fecha/i) as HTMLInputElement;
    const today = new Date().toISOString().split("T")[0];
    expect(dateInput.value).toBe(today);
  });
});
