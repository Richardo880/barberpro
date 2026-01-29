"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-left text-sm font-medium hover:text-primary transition-colors",
        isActive && "text-primary",
        className
      )}
    >
      {label}
      {isActive && currentDirection === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : isActive && currentDirection === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
}

export function useSortState<T>(initialSort: string | null = null, initialDirection: SortDirection = null) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortData = (data: T[], getters: Record<string, (item: T) => unknown>) => {
    if (!sortKey || !sortDirection) return data;

    const getter = getters[sortKey];
    if (!getter) return data;

    return [...data].sort((a, b) => {
      const aVal = getter(a);
      const bVal = getter(b);

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal, "es");
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "es");
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  return { sortKey, sortDirection, handleSort, sortData };
}
