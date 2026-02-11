"use client";

import { useState } from "react";
import { ChevronLeft, Eye } from "lucide-react";
import type { ProgramBuilderEditorProps } from "./types";
import { CurriculumTab } from "./CurriculumTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { InfoTab } from "./InfoTab";
import { GoalsTab } from "./GoalsTab";
import { ResourcesTab } from "./ResourcesTab";
import { ReportsTab } from "./ReportsTab";

type EditorTab = "curriculum" | "participants" | "info" | "goals" | "resources" | "reports";

const tabs: { id: EditorTab; label: string }[] = [
  { id: "curriculum", label: "Curriculum" },
  { id: "participants", label: "Participants" },
  { id: "info", label: "Info" },
  { id: "goals", label: "Goals" },
  { id: "resources", label: "Resources" },
  { id: "reports", label: "Reports" },
];

export function ProgramBuilderEditor({ onBack }: ProgramBuilderEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("curriculum");

  const renderTabContent = () => {
    switch (activeTab) {
      case "curriculum":
        return <CurriculumTab />;
      case "participants":
        return <ParticipantsTab />;
      case "info":
        return <InfoTab />;
      case "goals":
        return <GoalsTab />;
      case "resources":
        return <ResourcesTab />;
      case "reports":
        return <ReportsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-4 border-b border-border flex items-center justify-between sticky top-0 z-40 bg-background">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-sidebar-foreground">
              LeaderShift: Manager to Leader Transformation
            </h1>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Draft
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            Save Changes
          </button>
          <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
            Publish Program
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-8 border-b border-border bg-background">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm transition-colors relative ${
                activeTab === tab.id
                  ? "text-accent"
                  : "text-muted-foreground hover:text-sidebar-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  );
}
