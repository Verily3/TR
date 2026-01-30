"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  ClipboardList,
  Megaphone,
  Activity,
  FolderOpen,
  Settings,
  Building2,
  CreditCard,
  BarChart3,
  Palette,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContextType } from "@/stores/auth-store";
import { ContextSwitcher } from "./context-switcher";

// Tenant navigation items
const tenantNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Programs", href: "/programs", icon: BookOpen },
  { name: "Scorecard", href: "/scorecard", icon: Target },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Coaching", href: "/coaching", icon: MessageSquare },
  { name: "Assessments", href: "/assessments", icon: ClipboardList },
  { name: "Announcements", href: "/announcements", icon: Megaphone },
  { name: "Feed", href: "/feed", icon: Activity },
  { name: "Members", href: "/members", icon: Users },
  { name: "Resources", href: "/resources", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Agency navigation items (per spec: Agency Account Features)
const agencyNavigation = [
  { name: "Overview", href: "/agency", icon: LayoutDashboard },
  { name: "Clients", href: "/agency/clients", icon: Building2 },
  { name: "Team", href: "/agency/team", icon: Users },
  { name: "Templates", href: "/agency/templates", icon: FolderOpen },
  { name: "Assessments", href: "/agency/assessments", icon: ClipboardList },
  { name: "Analytics", href: "/agency/analytics", icon: BarChart3 },
  { name: "Billing", href: "/agency/billing", icon: CreditCard },
  { name: "Branding", href: "/agency/branding", icon: Palette },
  { name: "Governance", href: "/agency/governance", icon: Shield },
  { name: "Settings", href: "/agency/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const contextType = useContextType();

  const navigation = contextType === "agency" ? agencyNavigation : tenantNavigation;

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Context Switcher */}
      <div className="p-6 border-b border-sidebar-border">
        <ContextSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/agency" && item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          Transformation OS v0.1.0
        </p>
      </div>
    </aside>
  );
}
