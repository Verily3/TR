'use client';

import { useState } from 'react';
import {
  ClipboardList,
  Target,
  Clock,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type {
  DashboardUpcomingItem,
  DashboardGoal,
  DashboardApproval,
} from '@/hooks/api/useLearnerDashboard';

type TabId = 'assignments' | 'goals' | 'approvals';

interface WeekAtAGlanceProps {
  upcomingItems: DashboardUpcomingItem[];
  activeGoals: DashboardGoal[];
  pendingApprovals: DashboardApproval[];
}

const contentTypeIcons: Record<string, typeof ClipboardList> = {
  assignment: ClipboardList,
  goal: Target,
  text_form: FileCheck,
  mentor_approval: FileCheck,
  facilitator_approval: FileCheck,
};

export function WeekAtAGlance({
  upcomingItems,
  activeGoals,
  pendingApprovals,
}: WeekAtAGlanceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('assignments');

  const assignments = upcomingItems.filter((item) =>
    ['assignment', 'text_form', 'mentor_approval', 'facilitator_approval'].includes(item.contentType)
  );

  const tabs: { id: TabId; label: string; count: number; icon: typeof ClipboardList }[] = [
    { id: 'assignments', label: 'Assignments', count: assignments.length, icon: ClipboardList },
    { id: 'goals', label: 'Goals', count: activeGoals.length, icon: Target },
    { id: 'approvals', label: 'Approvals', count: pendingApprovals.length, icon: FileCheck },
  ];

  const navigateToLesson = (programId: string) => {
    router.push(`/programs/${programId}/learn`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl text-sidebar-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          Week at a Glance
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Your upcoming items this week
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-xl flex-1">
        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="divide-y divide-border">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No assignments due. You&apos;re all caught up!
              </div>
            ) : (
              assignments.map((item) => {
                const Icon = contentTypeIcons[item.contentType] || ClipboardList;
                return (
                  <div
                    key={`${item.lessonId}-${item.programId}`}
                    onClick={() => navigateToLesson(item.programId)}
                    className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-sidebar-foreground truncate">{item.lessonTitle}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{item.programName}</span>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground">{item.moduleTitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {item.points > 0 && (
                          <div className="text-xs text-accent">{item.points} pts</div>
                        )}
                        <div className="text-xs text-muted-foreground capitalize">
                          {item.progressStatus === 'in_progress' ? 'Started' : 'Not started'}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="divide-y divide-border">
            {activeGoals.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No active goals to review.
              </div>
            ) : (
              activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => router.push('/planning')}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <Target className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-sidebar-foreground mb-1">{goal.statement}</h4>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded">
                          {goal.programName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Review: {goal.reviewFrequency}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${goal.latestProgress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {goal.latestProgress ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {goal.targetDate && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Target</div>
                          <div className="text-xs text-sidebar-foreground">
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="divide-y divide-border">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No pending approvals.
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  onClick={() => navigateToLesson(approval.programId)}
                  className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <FileCheck className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-sidebar-foreground truncate">{approval.lessonTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{approval.programName}</span>
                      <span className="text-xs text-muted-foreground">&middot;</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        Awaiting {approval.reviewerRole}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded text-xs">
                      Pending
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
