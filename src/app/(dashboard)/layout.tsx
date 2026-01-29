import { ReactNode } from "react";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { PromoBanner } from "@/components/layout/promo-banner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PromoBanner />
      <DashboardNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
