import { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { PromoBanner } from "@/components/layout/promo-banner";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PromoBanner />
      <PublicNavbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </>
  );
}
