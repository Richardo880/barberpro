import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { Calendar, Search, FileX } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No hay datos" />);

    expect(screen.getByText("No hay datos")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="Sin resultados"
        description="No se encontraron elementos que coincidan con tu búsqueda"
      />
    );

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(
      screen.getByText("No se encontraron elementos que coincidan con tu búsqueda")
    ).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Sin datos" />);

    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Sin citas" icon={Calendar} />);

    // Icon should be rendered as SVG
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Sin citas"
        action={{ label: "Crear cita", onClick }}
      />
    );

    expect(screen.getByRole("button", { name: "Crear cita" })).toBeInTheDocument();
  });

  it("calls action onClick when button clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Sin citas"
        action={{ label: "Agregar", onClick }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render button when action not provided", () => {
    render(<EmptyState title="Vacío" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders children when provided", () => {
    render(
      <EmptyState title="Sin resultados">
        <span data-testid="custom-content">Contenido personalizado</span>
      </EmptyState>
    );

    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
    expect(screen.getByText("Contenido personalizado")).toBeInTheDocument();
  });

  it("renders with Search icon", () => {
    const { container } = render(<EmptyState title="Sin búsquedas" icon={Search} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with FileX icon", () => {
    const { container } = render(<EmptyState title="Archivo no encontrado" icon={FileX} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders all elements together", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Calendar}
        title="No hay citas programadas"
        description="Programa tu primera cita para comenzar"
        action={{ label: "Programar cita", onClick }}
      >
        <p data-testid="extra">Contenido extra</p>
      </EmptyState>
    );

    expect(document.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("No hay citas programadas")).toBeInTheDocument();
    expect(screen.getByText("Programa tu primera cita para comenzar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Programar cita" })).toBeInTheDocument();
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    const { container } = render(<EmptyState title="Test" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("min-h-[400px]");
    expect(wrapper).toHaveClass("border-dashed");
  });
});
