"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  Home,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Turnos", href: "/admin/turnos", icon: Calendar },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Servicios", href: "/admin/servicios", icon: Scissors },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background p-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">BarberPro</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BarberPro</span>
            <span className="ml-auto rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Admin
            </span>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="mr-3 h-4 w-4" />
                Ir al sitio
              </Button>
            </Link>

            <Separator className="my-2" />

            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* User info */}
          <div className="p-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for mobile to account for top bar */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
