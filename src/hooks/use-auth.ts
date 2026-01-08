"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@prisma/client";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    role: session?.user?.role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading };
}

export function useRequireRole(allowedRoles: Role[], redirectTo = "/") {
  const router = useRouter();
  const { role, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!role || !allowedRoles.includes(role)) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router, redirectTo]);

  return { isLoading };
}
