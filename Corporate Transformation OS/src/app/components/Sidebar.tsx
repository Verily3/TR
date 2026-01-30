import { Home, BookOpen, Target, Users, ClipboardCheck, BarChart3 } from "lucide-react";
import logoIcon from "figma:asset/26c4afcb760ca0948720d594753021faa4c27f19.png";

type Page = "dashboard" | "scorecard" | "goals" | "programs" | "program-detail" | "coaching" | "module-view";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", page: "dashboard" as Page },
  { icon: BookOpen, label: "Programs", page: "programs" as Page },
  { icon: BarChart3, label: "Scorecard", page: "scorecard" as Page },
  { icon: Target, label: "Goals", page: "goals" as Page },
  { icon: Users, label: "Coaching", page: "coaching" as Page },
  { icon: ClipboardCheck, label: "Assessments", page: "assessments" as Page },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  // Treat module-view and program-detail as programs for navigation highlighting
  const activeNavPage = currentPage === "module-view" || currentPage === "program-detail" ? "programs" : currentPage;

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoIcon} alt="RTS" className="w-8 h-8" />
          <div>
            <div className="text-sm tracking-wide text-sidebar-foreground">Results Tracking</div>
            <div className="text-xs text-muted-foreground">System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavPage === item.page;
            return (
              <li key={item.label}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            JD
          </div>
          <div className="flex-1">
            <div className="text-sm text-sidebar-foreground">John Doe</div>
            <div className="text-xs text-muted-foreground">Executive</div>
          </div>
        </div>
      </div>
    </div>
  );
}