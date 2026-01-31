import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppointmentCard } from "../appointment-card";
import { mockServices, mockStaff } from "@/test/mockData";

const mockAppointment = {
  id: "apt-1",
  startTime: "2024-03-15T10:00:00Z",
  endTime: "2024-03-15T10:30:00Z",
  status: "PENDING",
  service: {
    id: mockServices[0].id,
    name: mockServices[0].name,
    price: 50000,
  },
  staff: {
    id: mockStaff[0].id,
    name: mockStaff[0].name,
  },
  client: {
    id: "client-1",
    name: "Juan Cliente",
    phone: "+595991234567",
  },
  clientNotes: "Prefiero corte clásico",
};

describe("AppointmentCard", () => {
  it("renders appointment date and time", () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    // Time is formatted from UTC, check that time format is displayed
    expect(screen.getByText(/\d{2}:\d{2} hs/)).toBeInTheDocument();
  });

  it("renders service name and price", () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText(mockServices[0].name)).toBeInTheDocument();
    expect(screen.getByText(/₲ 50.000/)).toBeInTheDocument();
  });

  it("renders staff name", () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText(/Barbero:/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockStaff[0].name))).toBeInTheDocument();
  });

  it("renders client notes when present", () => {
    render(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText("Prefiero corte clásico")).toBeInTheDocument();
  });

  it("does not render client notes when absent", () => {
    const appointmentWithoutNotes = { ...mockAppointment, clientNotes: null };
    render(<AppointmentCard appointment={appointmentWithoutNotes} />);

    expect(screen.queryByText("Prefiero corte clásico")).not.toBeInTheDocument();
  });

  describe("status badges", () => {
    it("shows Pendiente badge for PENDING status", () => {
      render(<AppointmentCard appointment={{ ...mockAppointment, status: "PENDING" }} />);

      expect(screen.getByText("Pendiente")).toBeInTheDocument();
    });

    it("shows Confirmado badge for CONFIRMED status", () => {
      render(<AppointmentCard appointment={{ ...mockAppointment, status: "CONFIRMED" }} />);

      expect(screen.getByText("Confirmado")).toBeInTheDocument();
    });

    it("shows Completado badge for COMPLETED status", () => {
      render(<AppointmentCard appointment={{ ...mockAppointment, status: "COMPLETED" }} />);

      expect(screen.getByText("Completado")).toBeInTheDocument();
    });

    it("shows Cancelado badge for CANCELLED status", () => {
      render(<AppointmentCard appointment={{ ...mockAppointment, status: "CANCELLED" }} />);

      expect(screen.getByText("Cancelado")).toBeInTheDocument();
    });

    it("shows No asistió badge for NO_SHOW status", () => {
      render(<AppointmentCard appointment={{ ...mockAppointment, status: "NO_SHOW" }} />);

      expect(screen.getByText("No asistió")).toBeInTheDocument();
    });
  });

  describe("client role behavior", () => {
    it("shows cancel button for PENDING status", () => {
      const onCancel = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "PENDING" }}
          role="CLIENT"
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("shows cancel button for CONFIRMED status", () => {
      const onCancel = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "CONFIRMED" }}
          role="CLIENT"
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("does not show cancel button for COMPLETED status", () => {
      const onCancel = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "COMPLETED" }}
          role="CLIENT"
          onCancel={onCancel}
        />
      );

      expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    });

    it("does not show client info for CLIENT role", () => {
      render(<AppointmentCard appointment={mockAppointment} role="CLIENT" />);

      expect(screen.queryByText(/Cliente:/)).not.toBeInTheDocument();
    });

    it("calls onCancel when cancel button clicked", () => {
      const onCancel = vi.fn();
      render(
        <AppointmentCard
          appointment={mockAppointment}
          role="CLIENT"
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(onCancel).toHaveBeenCalledWith("apt-1");
    });
  });

  describe("admin/staff role behavior", () => {
    it("shows client info for ADMIN role", () => {
      render(<AppointmentCard appointment={mockAppointment} role="ADMIN" />);

      expect(screen.getByText(/Cliente:/)).toBeInTheDocument();
      expect(screen.getByText(/Juan Cliente/)).toBeInTheDocument();
    });

    it("shows client info for STAFF role", () => {
      render(<AppointmentCard appointment={mockAppointment} role="STAFF" />);

      expect(screen.getByText(/Cliente:/)).toBeInTheDocument();
    });

    it("shows client phone when available", () => {
      render(<AppointmentCard appointment={mockAppointment} role="ADMIN" />);

      expect(screen.getByText(/\+595991234567/)).toBeInTheDocument();
    });

    it("shows confirm button for PENDING status", () => {
      const onConfirm = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "PENDING" }}
          role="ADMIN"
          onConfirm={onConfirm}
        />
      );

      expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    });

    it("shows complete button for CONFIRMED status", () => {
      const onComplete = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "CONFIRMED" }}
          role="ADMIN"
          onComplete={onComplete}
        />
      );

      expect(screen.getByRole("button", { name: "Marcar Completado" })).toBeInTheDocument();
    });

    it("calls onConfirm when confirm button clicked", () => {
      const onConfirm = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "PENDING" }}
          role="ADMIN"
          onConfirm={onConfirm}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
      expect(onConfirm).toHaveBeenCalledWith("apt-1");
    });

    it("calls onComplete when complete button clicked", () => {
      const onComplete = vi.fn();
      render(
        <AppointmentCard
          appointment={{ ...mockAppointment, status: "CONFIRMED" }}
          role="ADMIN"
          onComplete={onComplete}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Marcar Completado" }));
      expect(onComplete).toHaveBeenCalledWith("apt-1");
    });
  });

  it("renders without staff when not assigned", () => {
    const appointmentWithoutStaff = { ...mockAppointment, staff: null };
    render(<AppointmentCard appointment={appointmentWithoutStaff} />);

    expect(screen.queryByText(/Barbero:/)).not.toBeInTheDocument();
  });

  it("handles string price correctly", () => {
    const appointmentWithStringPrice = {
      ...mockAppointment,
      service: { ...mockAppointment.service, price: "75000" },
    };
    render(<AppointmentCard appointment={appointmentWithStringPrice} />);

    expect(screen.getByText(/₲ 75000/)).toBeInTheDocument();
  });
});
