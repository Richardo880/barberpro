"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, Calendar, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicNavbar() {
  const { user, isAuthenticated, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDashboardLink = () => {
    if (role === "ADMIN" || role === "STAFF") return "/admin";
    return "/mi-cuenta";
  };

  return (
    <nav className="border-b border-stone-700/30 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/images/menu/logo.jpeg"
              alt="Barbería Imperio"
              width={40}
              height={40}
              className="rounded-full shadow-md group-hover:shadow-yellow-700/50 transition-all"
              unoptimized
            />
            <span className="text-xl font-bold text-stone-100 group-hover:text-yellow-600 transition-colors">Barbería Imperio</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-stone-300 transition-colors hover:text-yellow-600"
            >
              Inicio
            </Link>
            <Link
              href="/servicios"
              className="text-sm font-medium text-stone-300 transition-colors hover:text-yellow-600"
            >
              Servicios
            </Link>
            <Link
              href="/barberos"
              className="text-sm font-medium text-stone-300 transition-colors hover:text-yellow-600"
            >
              Barberos
            </Link>
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center space-x-4">
            <ThemeToggle variant="navbar" />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-stone-700/50">
                    <Avatar className="border-2 border-yellow-700/50">
                      <AvatarFallback className="bg-gradient-to-br from-yellow-700 to-yellow-900 text-yellow-50">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-stone-900 border-stone-700 text-stone-100">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center">
                      {role === "ADMIN" || role === "STAFF" ? (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Panel de Admin</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Mis Turnos</span>
                        </>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta/perfil" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Mi Cuenta</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center space-x-2 md:flex">
                <Button variant="ghost" asChild className="text-stone-300 hover:text-yellow-600 hover:bg-stone-700/50">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-yellow-700 to-yellow-900 hover:from-yellow-600 hover:to-yellow-800 text-yellow-50 shadow-md">
                  <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-stone-700/30 py-4 md:hidden bg-stone-800/50">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-sm font-medium text-stone-300 hover:text-yellow-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/servicios"
                className="text-sm font-medium text-stone-300 hover:text-yellow-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Servicios
              </Link>
              <Link
                href="/barberos"
                className="text-sm font-medium text-stone-300 hover:text-yellow-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Barberos
              </Link>
              {!isAuthenticated && (
                <>
                  <Button variant="ghost" className="justify-start text-stone-300 hover:text-yellow-600 hover:bg-stone-700/50" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button className="justify-start bg-gradient-to-r from-yellow-700 to-yellow-900 text-yellow-50" asChild>
                    <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
