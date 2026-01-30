"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAuthStore,
  useCurrentTenant,
  useCurrentAgency,
  useContextType,
  useTenants,
  useAgencies,
} from "@/stores/auth-store";

export function ContextSwitcher() {
  const router = useRouter();
  const contextType = useContextType();
  const currentTenant = useCurrentTenant();
  const currentAgency = useCurrentAgency();
  const tenants = useTenants();
  const agencies = useAgencies();
  const { switchToAgency, switchToTenant } = useAuthStore();

  const currentContext =
    contextType === "agency"
      ? { type: "agency", name: currentAgency?.name, role: currentAgency?.role }
      : { type: "tenant", name: currentTenant?.name, role: currentTenant?.role };

  const handleSwitchToAgency = (agencyId: string) => {
    switchToAgency(agencyId);
    router.push("/agency");
  };

  const handleSwitchToTenant = (tenantId: string) => {
    switchToTenant(tenantId);
    router.push("/dashboard");
  };

  // Don't show switcher if user has no agencies and only one tenant
  if (agencies.length === 0 && tenants.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTenant?.name || "No workspace"}</p>
          <p className="text-xs text-muted-foreground capitalize">{currentTenant?.role || "user"}</p>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-auto py-1.5"
        >
          <div
            className={cn(
              "h-8 w-8 rounded flex items-center justify-center",
              contextType === "agency" ? "bg-violet-100 dark:bg-violet-900" : "bg-primary/10"
            )}
          >
            {contextType === "agency" ? (
              <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{currentContext.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {contextType === "agency" ? "Agency" : "Workspace"} · {currentContext.role}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start" side="bottom">
        {agencies.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Agencies
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {agencies.map((agency) => (
                <DropdownMenuItem
                  key={agency.id}
                  onClick={() => handleSwitchToAgency(agency.id)}
                  className="cursor-pointer"
                >
                  <div className="h-6 w-6 rounded bg-violet-100 dark:bg-violet-900 flex items-center justify-center mr-2">
                    <Building2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{agency.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{agency.role}</p>
                  </div>
                  {contextType === "agency" && currentAgency?.id === agency.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => handleSwitchToTenant(tenant.id)}
              className="cursor-pointer"
            >
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-6 w-6 rounded mr-2"
                />
              ) : (
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center mr-2">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{tenant.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{tenant.role}</p>
              </div>
              {contextType === "tenant" && currentTenant?.id === tenant.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
