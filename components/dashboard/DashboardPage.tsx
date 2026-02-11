"use client";

import { OnboardingTracker } from "./OnboardingTracker";
import { JourneyHub } from "./JourneyHub";
import { LeaderShiftTracker } from "./LeaderShiftTracker";
import { Leaderboard } from "./Leaderboard";
import { MySchedule } from "./MySchedule";
import { LearningQueue } from "./LearningQueue";

interface DashboardPageProps {
  userName?: string;
  showOnboarding?: boolean;
}

export function DashboardPage({ userName = "John", showOnboarding = true }: DashboardPageProps) {
  // Get current date formatted
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Dashboard Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl text-sidebar-foreground mb-1 sm:mb-2">Welcome back, {userName}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {dateString} • You have 2 actions that need attention
        </p>
      </div>

      {/* Onboarding Tracker (conditional) */}
      {showOnboarding && (
        <OnboardingTracker
          onContinue={() => {
            console.log("Continue onboarding");
          }}
        />
      )}

      {/* LeaderShift Program Tracker */}
      <LeaderShiftTracker
        onContinue={() => {
          console.log("Continue learning");
        }}
      />

      {/* Journey Hub */}
      <JourneyHub />

      {/* Leaderboard */}
      <Leaderboard />

      {/* Two-Column Layout: Schedule & Learning Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <MySchedule
          onViewCalendar={() => {
            console.log("View calendar");
          }}
        />
        <LearningQueue />
      </div>
    </div>
  );
}
