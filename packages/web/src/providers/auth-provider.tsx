"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setUser,
    setTenants,
    setAgencies,
    setCurrentTenant,
    setCurrentAgency,
    setLoading,
    logout,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from API
          const response = await api.get<{
            user: {
              id: string;
              email: string;
              firstName: string | null;
              lastName: string | null;
              avatarUrl: string | null;
            };
            tenants: Array<{
              id: string;
              name: string;
              slug: string;
              role: "admin" | "user";
              logoUrl: string | null;
            }>;
            agencies: Array<{
              id: string;
              name: string;
              role: "owner" | "admin" | "member";
            }>;
          }>("/auth/me");

          if (response.data) {
            setUser(response.data.user);
            setTenants(response.data.tenants);
            setAgencies(response.data.agencies);

            // Set default tenant if not set
            const { currentTenantId, currentAgencyId } = useAuthStore.getState();
            if (!currentTenantId && response.data.tenants.length > 0) {
              setCurrentTenant(response.data.tenants[0].id);
            }

            // Set default agency if not set
            if (!currentAgencyId && response.data.agencies.length > 0) {
              setCurrentAgency(response.data.agencies[0].id);
            }

            // Redirect to dashboard if on public path
            if (PUBLIC_PATHS.includes(pathname)) {
              router.push("/dashboard");
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          // User exists in Firebase but not in our DB - redirect to complete registration
          if (PUBLIC_PATHS.includes(pathname)) {
            // Stay on public path
          } else {
            router.push("/login");
          }
        }
      } else {
        logout();
        // Redirect to login if on protected path
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, setUser, setTenants, setAgencies, setCurrentTenant, setCurrentAgency, setLoading, logout]);

  return <>{children}</>;
}
