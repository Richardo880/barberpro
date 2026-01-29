"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePromotion, isPromoActive } from "@/hooks/use-promotion";

const STORAGE_KEY = "promo_banner_dismissed";

interface DismissedState {
  date: string;
  dismissed: boolean;
}

export function PromoBanner() {
  const { data } = usePromotion();
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
  const [isClient, setIsClient] = useState(false);

  const promotion = data?.promotion;
  const showPromo = isPromoActive(promotion);

  useEffect(() => {
    setIsClient(true);

    // Check localStorage for dismissed state
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: DismissedState = JSON.parse(stored);
        const today = new Date().toISOString().split("T")[0];

        // If dismissed today, keep it hidden
        if (state.date === today && state.dismissed) {
          setIsDismissed(true);
          return;
        }
      } catch {
        // Invalid stored data, ignore
      }
    }

    // Show banner if not dismissed today
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    const state: DismissedState = { date: today, dismissed: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setIsDismissed(true);
  };

  // Don't render during SSR or if promo is not active or if dismissed
  if (!isClient || !showPromo || isDismissed || !promotion) {
    return null;
  }

  return (
    <div className="relative bg-red-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center">
        <p className="text-sm font-medium text-center pr-8">
          {promotion.message}
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-red-700 rounded-full transition-colors"
          aria-label="Cerrar banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
