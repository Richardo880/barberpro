import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header with logo */}
      <div className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="font-bold">BP</span>
            </div>
            <span className="text-xl font-bold">BarberPro</span>
          </Link>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
