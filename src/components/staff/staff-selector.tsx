"use client";

import { StaffCard } from "./staff-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserX } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  bio?: string | null;
  photoUrl?: string | null;
  specialties?: string[];
  services?: Array<{
    id: string;
    name: string;
  }>;
}

interface StaffSelectorProps {
  staff: Staff[];
  selectedId?: string | null;
  onSelect: (staffId: string | null) => void;
  loading?: boolean;
  allowNoPreference?: boolean;
}

export function StaffSelector({
  staff,
  selectedId,
  onSelect,
  loading,
  allowNoPreference = true,
}: StaffSelectorProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <StaffCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <UserX className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">No hay barberos disponibles</p>
        <p className="mt-2 text-sm text-muted-foreground">
          No hay staff disponible para realizar este servicio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allowNoPreference && (
        <Card
          className={
            selectedId === null
              ? "border-primary shadow-md"
              : "cursor-pointer transition-shadow hover:shadow-md"
          }
          onClick={() => onSelect(null)}
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Sin preferencia</p>
                <p className="text-sm text-muted-foreground">
                  Cualquier barbero disponible
                </p>
              </div>
            </div>
            <Button
              variant={selectedId === null ? "default" : "outline"}
              size="sm"
            >
              {selectedId === null ? "Seleccionado" : "Seleccionar"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((staffMember) => (
          <StaffCard
            key={staffMember.id}
            staff={staffMember}
            onSelect={onSelect}
            selected={selectedId === staffMember.id}
          />
        ))}
      </div>
    </div>
  );
}

function StaffCardSkeleton() {
  return (
    <div className="flex flex-col space-y-4 rounded-lg border p-6">
      <div className="mx-auto">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <Skeleton className="mx-auto h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
