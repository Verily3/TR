import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "user";
  logoUrl: string | null;
}

interface Agency {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

type ContextType = "agency" | "tenant";

interface AuthState {
  // State
  user: User | null;
  tenants: Tenant[];
  agencies: Agency[];
  currentTenantId: string | null;
  currentAgencyId: string | null;
  contextType: ContextType;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  setAgencies: (agencies: Agency[]) => void;
  setCurrentTenant: (tenantId: string | null) => void;
  setCurrentAgency: (agencyId: string | null) => void;
  setContextType: (type: ContextType) => void;
  switchToAgency: (agencyId: string) => void;
  switchToTenant: (tenantId: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      tenants: [],
      agencies: [],
      currentTenantId: null,
      currentAgencyId: null,
      contextType: "tenant",
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTenants: (tenants) => set({ tenants }),

      setAgencies: (agencies) => set({ agencies }),

      setCurrentTenant: (tenantId) => set({ currentTenantId: tenantId }),

      setCurrentAgency: (agencyId) => set({ currentAgencyId: agencyId }),

      setContextType: (contextType) => set({ contextType }),

      switchToAgency: (agencyId) =>
        set({
          currentAgencyId: agencyId,
          contextType: "agency",
        }),

      switchToTenant: (tenantId) =>
        set({
          currentTenantId: tenantId,
          contextType: "tenant",
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          user: null,
          tenants: [],
          agencies: [],
          currentTenantId: null,
          currentAgencyId: null,
          contextType: "tenant",
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        currentTenantId: state.currentTenantId,
        currentAgencyId: state.currentAgencyId,
        contextType: state.contextType,
      }),
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useTenants = () => useAuthStore((state) => state.tenants);
export const useAgencies = () => useAuthStore((state) => state.agencies);
export const useContextType = () => useAuthStore((state) => state.contextType);

export const useCurrentTenant = () => {
  const tenants = useAuthStore((state) => state.tenants);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  return tenants.find((t) => t.id === currentTenantId) || tenants[0] || null;
};

export const useCurrentAgency = () => {
  const agencies = useAuthStore((state) => state.agencies);
  const currentAgencyId = useAuthStore((state) => state.currentAgencyId);
  return agencies.find((a) => a.id === currentAgencyId) || agencies[0] || null;
};

export const useCurrentContext = () => {
  const contextType = useAuthStore((state) => state.contextType);
  const currentTenant = useCurrentTenant();
  const currentAgency = useCurrentAgency();

  if (contextType === "agency" && currentAgency) {
    return { type: "agency" as const, data: currentAgency };
  }
  if (currentTenant) {
    return { type: "tenant" as const, data: currentTenant };
  }
  return null;
};

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Check if user has agency access
export const useHasAgencyAccess = () => {
  const agencies = useAuthStore((state) => state.agencies);
  return agencies.length > 0;
};
