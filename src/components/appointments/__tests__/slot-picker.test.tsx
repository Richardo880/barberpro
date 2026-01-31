import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlotPicker } from "../slot-picker";

const mockSlots = [
  { start: "2024-03-15T09:00:00Z", end: "2024-03-15T09:30:00Z", available: true },
  { start: "2024-03-15T09:30:00Z", end: "2024-03-15T10:00:00Z", available: true },
  { start: "2024-03-15T10:00:00Z", end: "2024-03-15T10:30:00Z", available: false },
  { start: "2024-03-15T10:30:00Z", end: "2024-03-15T11:00:00Z", available: true },
];

describe("SlotPicker", () => {
  it("renders available slots", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={mockSlots} onSelect={onSelect} />);

    expect(screen.getByText("3 horarios disponibles")).toBeInTheDocument();
  });

  it("renders all slot times", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={mockSlots} onSelect={onSelect} />);

    // Note: times are in UTC, display depends on timezone
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("shows loading state with skeleton buttons", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={[]} onSelect={onSelect} loading={true} />);

    const loadingButtons = screen.getAllByRole("button");
    expect(loadingButtons).toHaveLength(12);
    expect(loadingButtons[0]).toHaveTextContent("--:--");
  });

  it("shows empty state when no slots available", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={[]} onSelect={onSelect} />);

    expect(screen.getByText("No hay horarios disponibles para este día")).toBeInTheDocument();
  });

  it("shows all slots occupied message when all are unavailable", () => {
    const unavailableSlots = mockSlots.map((slot) => ({ ...slot, available: false }));
    const onSelect = vi.fn();
    render(<SlotPicker slots={unavailableSlots} onSelect={onSelect} />);

    expect(screen.getByText("Todos los horarios están ocupados")).toBeInTheDocument();
    expect(screen.getByText("Por favor, selecciona otro día")).toBeInTheDocument();
  });

  it("calls onSelect when available slot is clicked", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={mockSlots} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // First available slot

    expect(onSelect).toHaveBeenCalledWith(mockSlots[0]);
  });

  it("does not call onSelect when unavailable slot is clicked", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={mockSlots} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]); // Unavailable slot

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("highlights selected slot", () => {
    const onSelect = vi.fn();
    const selectedSlot = mockSlots[0];
    render(<SlotPicker slots={mockSlots} selectedSlot={selectedSlot} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    // Selected slot should have different variant (default vs outline)
    expect(buttons[0]).toHaveClass("bg-primary");
  });

  it("disables unavailable slots", () => {
    const onSelect = vi.fn();
    render(<SlotPicker slots={mockSlots} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[2]).toBeDisabled();
  });

  it("shows singular form for 1 available slot", () => {
    const singleSlot = [mockSlots[0]];
    const onSelect = vi.fn();
    render(<SlotPicker slots={singleSlot} onSelect={onSelect} />);

    expect(screen.getByText("1 horario disponible")).toBeInTheDocument();
  });

  it("handles Date objects for slot times", () => {
    const dateSlots = [
      { start: new Date("2024-03-15T09:00:00Z"), end: new Date("2024-03-15T09:30:00Z"), available: true },
    ];
    const onSelect = vi.fn();
    render(<SlotPicker slots={dateSlots} onSelect={onSelect} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
