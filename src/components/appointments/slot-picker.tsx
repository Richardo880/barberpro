"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Slot {
  start: string | Date;
  end: string | Date;
  available: boolean;
}

interface SlotPickerProps {
  slots: Slot[];
  selectedSlot?: Slot | null;
  onSelect: (slot: Slot) => void;
  loading?: boolean;
}

export function SlotPicker({ slots, selectedSlot, onSelect, loading }: SlotPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {[...Array(12)].map((_, i) => (
          <Button key={i} variant="outline" disabled className="h-12">
            --:--
          </Button>
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay horarios disponibles para este día
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-medium">Todos los horarios están ocupados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Por favor, selecciona otro día
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {availableSlots.length} horario{availableSlots.length !== 1 ? "s" : ""} disponible
        {availableSlots.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((slot, index) => {
          const startTime = new Date(slot.start);
          const isSelected =
            selectedSlot &&
            new Date(selectedSlot.start).getTime() === startTime.getTime();

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              disabled={!slot.available}
              onClick={() => slot.available && onSelect(slot)}
              className={cn(
                "h-12 font-mono",
                !slot.available && "cursor-not-allowed opacity-40"
              )}
            >
              {format(startTime, "HH:mm")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
