import { useState } from "react";
import { Sidebar } from "@/app/components/Sidebar";
import { JourneyHub } from "@/app/components/JourneyHub";
import { ScorecardPage } from "@/app/components/scorecard/ScorecardPage";
import { PlanningGoalsPage } from "@/app/components/planning/PlanningGoalsPage";
import { MySchedule } from "@/app/components/MySchedule";
import { LearningQueue } from "@/app/components/LearningQueue";
import { GoalsPage } from "@/app/components/goals/GoalsPage";
import { ProgramsPage } from "@/app/components/programs/ProgramsPage";
import { ProgramDetailPage } from "@/app/components/programs/ProgramDetailPage";
import { CoachingPage } from "@/app/components/coaching/CoachingPage";
import { OnboardingTracker } from "@/app/components/OnboardingTracker";
import { ModuleViewLMS } from "@/app/components/programs/ModuleViewLMS";
import { Leaderboard } from "@/app/components/Leaderboard";

type Page = "dashboard" | "scorecard" | "goals" | "programs" | "program-detail" | "coaching" | "module-view";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  // Simulate user onboarding status - set to true to show onboarding tracker
  const [isOnboarding, setIsOnboarding] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {/* Demo Navigation Helper */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setCurrentPage("module-view")}
          className="px-3 py-2 bg-accent text-accent-foreground rounded-lg text-xs hover:bg-accent/90 transition-colors shadow-lg"
        >
          View Module (Demo)
        </button>
      </div>
      
      {currentPage === "dashboard" ? (
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-sidebar-foreground mb-2">Welcome back, John</h1>
              <p className="text-muted-foreground">
                Wednesday, January 14, 2026 • You have 2 actions that need attention
              </p>
            </div>

            {/* Onboarding Tracker - Only show for new users */}
            {isOnboarding && (
              <div className="mb-8">
                <OnboardingTracker />
                {/* Toggle for demo purposes */}
                <button 
                  onClick={() => setIsOnboarding(false)}
                  className="text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  (Demo: Hide onboarding tracker)
                </button>
              </div>
            )}

            {!isOnboarding && (
              <button 
                onClick={() => setIsOnboarding(true)}
                className="mb-4 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                (Demo: Show onboarding tracker)
              </button>
            )}

            {/* Journey Hub */}
            <div className="mb-10">
              <JourneyHub onNavigate={setCurrentPage} />
            </div>

            {/* Leaderboard */}
            <div className="mb-10">
              <Leaderboard />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* My Schedule */}
              <div>
                <MySchedule />
              </div>

              {/* Learning Queue */}
              <div>
                <LearningQueue />
              </div>
            </div>
          </div>
        </main>
      ) : currentPage === "scorecard" ? (
        <ScorecardPage />
      ) : currentPage === "goals" ? (
        <PlanningGoalsPage />
      ) : currentPage === "programs" ? (
        <ProgramsPage onNavigateToProgram={(programId) => setCurrentPage("program-detail")} />
      ) : currentPage === "program-detail" ? (
        <ProgramDetailPage 
          programId="leadershift" 
          onBack={() => setCurrentPage("programs")} 
          onStartModule={() => setCurrentPage("module-view")}
        />
      ) : currentPage === "coaching" ? (
        <CoachingPage />
      ) : currentPage === "module-view" ? (
        <ModuleViewLMS onBack={() => setCurrentPage("programs")} />
      ) : null}
    </div>
  );
}