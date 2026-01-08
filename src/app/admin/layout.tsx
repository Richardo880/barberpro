"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // El middleware ya protege estas rutas, no necesitamos verificar aquí
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30 lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
