import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StaffCard } from "../staff-card";
import { mockServices } from "@/test/mockData";

const mockStaffMember = {
  id: "staff-1",
  name: "Carlos Barbero",
  bio: "Especialista en cortes modernos con 10 años de experiencia",
  photoUrl: "https://example.com/carlos.jpg",
  specialties: ["Cortes clásicos", "Barba", "Fade"],
  services: [
    { id: mockServices[0].id, name: mockServices[0].name },
    { id: mockServices[1].id, name: mockServices[1].name },
  ],
};

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("StaffCard", () => {
  it("renders staff name", () => {
    render(<StaffCard staff={mockStaffMember} />);

    expect(screen.getByText("Carlos Barbero")).toBeInTheDocument();
  });

  it("renders staff bio", () => {
    render(<StaffCard staff={mockStaffMember} />);

    expect(screen.getByText(/Especialista en cortes modernos/)).toBeInTheDocument();
  });

  it("renders specialties as badges", () => {
    render(<StaffCard staff={mockStaffMember} />);

    expect(screen.getByText("Cortes clásicos")).toBeInTheDocument();
    expect(screen.getByText("Barba")).toBeInTheDocument();
    expect(screen.getByText("Fade")).toBeInTheDocument();
  });

  it("renders services list", () => {
    render(<StaffCard staff={mockStaffMember} />);

    expect(screen.getByText(mockServices[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockServices[1].name)).toBeInTheDocument();
  });

  it("shows +N más when more than 3 services", () => {
    const staffWithManyServices = {
      ...mockStaffMember,
      services: [
        { id: "1", name: "Servicio 1" },
        { id: "2", name: "Servicio 2" },
        { id: "3", name: "Servicio 3" },
        { id: "4", name: "Servicio 4" },
        { id: "5", name: "Servicio 5" },
      ],
    };
    render(<StaffCard staff={staffWithManyServices} />);

    expect(screen.getByText("+2 más")).toBeInTheDocument();
  });

  it("generates initials from name", () => {
    const staffWithoutPhoto = { ...mockStaffMember, photoUrl: null };
    render(<StaffCard staff={staffWithoutPhoto} />);

    expect(screen.getByText("CB")).toBeInTheDocument();
  });

  it("renders reservation link when no onSelect provided", () => {
    render(<StaffCard staff={mockStaffMember} />);

    const link = screen.getByRole("link", { name: /Reservar con Carlos/ });
    expect(link).toHaveAttribute("href", "/reservar?staff=staff-1");
  });

  describe("selection mode", () => {
    it("shows Seleccionar button when onSelect provided", () => {
      const onSelect = vi.fn();
      render(<StaffCard staff={mockStaffMember} onSelect={onSelect} />);

      expect(screen.getByRole("button", { name: "Seleccionar" })).toBeInTheDocument();
    });

    it("shows Seleccionado when selected", () => {
      const onSelect = vi.fn();
      render(<StaffCard staff={mockStaffMember} onSelect={onSelect} selected={true} />);

      expect(screen.getByRole("button", { name: "Seleccionado" })).toBeInTheDocument();
    });

    it("calls onSelect with staffId when clicked", () => {
      const onSelect = vi.fn();
      render(<StaffCard staff={mockStaffMember} onSelect={onSelect} />);

      fireEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
      expect(onSelect).toHaveBeenCalledWith("staff-1");
    });

    it("applies border styling when selected", () => {
      const onSelect = vi.fn();
      const { container } = render(
        <StaffCard staff={mockStaffMember} onSelect={onSelect} selected={true} />
      );

      const card = container.querySelector(".border-primary");
      expect(card).toBeInTheDocument();
    });
  });

  it("renders without bio when not provided", () => {
    const staffWithoutBio = { ...mockStaffMember, bio: null };
    render(<StaffCard staff={staffWithoutBio} />);

    expect(screen.queryByText(/Especialista/)).not.toBeInTheDocument();
  });

  it("renders without specialties section when empty", () => {
    const staffWithoutSpecialties = { ...mockStaffMember, specialties: [] };
    render(<StaffCard staff={staffWithoutSpecialties} />);

    expect(screen.queryByText("Especialidades")).not.toBeInTheDocument();
  });

  it("renders without services section when empty", () => {
    const staffWithoutServices = { ...mockStaffMember, services: [] };
    render(<StaffCard staff={staffWithoutServices} />);

    expect(screen.queryByText("Servicios")).not.toBeInTheDocument();
  });

  it("handles single word name for initials", () => {
    const singleNameStaff = { ...mockStaffMember, name: "Carlos", photoUrl: null };
    render(<StaffCard staff={singleNameStaff} />);

    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("handles long name for initials (takes first two)", () => {
    const longNameStaff = { ...mockStaffMember, name: "Carlos Alberto Martínez López", photoUrl: null };
    render(<StaffCard staff={longNameStaff} />);

    expect(screen.getByText("CA")).toBeInTheDocument();
  });
});
