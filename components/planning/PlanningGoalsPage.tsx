"use client";

import { useState, useCallback } from "react";
import {
  Calendar,
  Target,
  CheckCircle2,
  TrendingUp,
  Filter,
  Plus,
} from "lucide-react";
import { AnnualPlanningTab } from "./AnnualPlanningTab";
import { QuarterlyPlanningTab } from "./QuarterlyPlanningTab";
import { GoalsTab } from "./GoalsTab";
import { MetricsTab } from "./MetricsTab";
import { NewGoalModal, GoalFormData } from "./NewGoalModal";

export interface PlanningGoalsPageProps {
  /** Initial active tab */
  initialTab?: TabId;
  /** Callback when an objective is selected in annual planning */
  onObjectiveSelect?: (id: string) => void;
  /** Callback when a goal is selected */
  onGoalSelect?: (id: string) => void;
  /** Callback when a goal is created */
  onGoalCreate?: (goalData: GoalFormData) => void;
  /** Callback when filter button is clicked */
  onFilter?: () => void;
}

type TabId = "annual" | "quarterly" | "goals" | "metrics";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "annual",
    label: "Annual Planning",
    icon: <Calendar className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: "quarterly",
    label: "Quarterly Planning",
    icon: <Target className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: "goals",
    label: "Goals",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: "metrics",
    label: "Metrics & KPIs",
    icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
  },
];

export function PlanningGoalsPage({
  initialTab = "annual",
  onObjectiveSelect,
  onGoalSelect,
  onGoalCreate,
  onFilter,
}: PlanningGoalsPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGoalCreate = useCallback(
    (goalData: GoalFormData) => {
      onGoalCreate?.(goalData);
      setIsModalOpen(false);
    },
    [onGoalCreate]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "annual":
        return <AnnualPlanningTab onObjectiveSelect={onObjectiveSelect} />;
      case "quarterly":
        return <QuarterlyPlanningTab />;
      case "goals":
        return <GoalsTab onGoalSelect={onGoalSelect} />;
      case "metrics":
        return <MetricsTab />;
      default:
        return null;
    }
  };

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-sidebar-foreground mb-2">
              Planning & Goals
            </h1>
            <p className="text-muted-foreground">
              Strategic planning, quarterly execution, and goal tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onFilter}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <Filter className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Filter
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
              New Goal
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="mb-8 border-b border-border" aria-label="Planning sections">
        <div className="flex gap-6" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-sidebar-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleGoalCreate}
      />
    </main>
  );
}
