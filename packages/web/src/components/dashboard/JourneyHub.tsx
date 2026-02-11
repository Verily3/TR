'use client';

import { PlayCircle, Target, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type {
  DashboardEnrollment,
  DashboardUpcomingItem,
  DashboardGoal,
  DashboardApproval,
} from '@/hooks/api/useLearnerDashboard';

interface JourneyBlock {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  action: string;
  href?: string;
}

interface JourneyHubProps {
  enrollment: DashboardEnrollment | null;
  upcomingItems: DashboardUpcomingItem[];
  activeGoals: DashboardGoal[];
  pendingApprovals: DashboardApproval[];
  summary: { totalPoints: number; overallProgress: number };
}

export function JourneyHub({
  enrollment,
  upcomingItems,
  activeGoals,
  pendingApprovals,
  summary,
}: JourneyHubProps) {
  const router = useRouter();

  // Build dynamic journey blocks from real data
  const blocks: JourneyBlock[] = [];

  // 1. Continue current program
  if (enrollment) {
    blocks.push({
      id: 'program',
      title: enrollment.programName,
      description: `${enrollment.progress}% complete • ${summary.totalPoints.toLocaleString()} points earned`,
      icon: PlayCircle,
      progress: enrollment.progress,
      action: 'Continue Learning',
      href: `/programs/${enrollment.programId}/learn`,
    });
  }

  // 2. Next pending goal
  const nextGoal = activeGoals[0];
  if (nextGoal) {
    blocks.push({
      id: 'goal',
      title: nextGoal.statement.length > 50 ? nextGoal.statement.slice(0, 50) + '...' : nextGoal.statement,
      description: `${nextGoal.programName} • ${nextGoal.latestProgress ?? 0}% progress`,
      icon: Target,
      action: 'Review Goal',
    });
  }

  // 3. Next meeting
  const nextMeeting = upcomingItems.find((item) => item.contentType === 'mentor_meeting');
  if (nextMeeting) {
    blocks.push({
      id: 'meeting',
      title: nextMeeting.lessonTitle,
      description: `${nextMeeting.programName} • ${nextMeeting.moduleTitle}`,
      icon: FileText,
      action: 'View Details',
    });
  }

  // 4. Pending assignments count
  const assignmentCount = upcomingItems.filter((item) =>
    ['assignment', 'text_form'].includes(item.contentType)
  ).length;
  if (assignmentCount > 0) {
    blocks.push({
      id: 'assignments',
      title: `${assignmentCount} Assignment${assignmentCount > 1 ? 's' : ''} Due`,
      description: 'Complete your pending assignments',
      icon: TrendingUp,
      action: 'View Assignments',
    });
  }

  // 5. Pending approvals count
  if (pendingApprovals.length > 0) {
    blocks.push({
      id: 'approvals',
      title: `${pendingApprovals.length} Pending Approval${pendingApprovals.length > 1 ? 's' : ''}`,
      description: 'Waiting for mentor/facilitator review',
      icon: FileText,
      action: 'View Status',
    });
  }

  // Fallback blocks if no real data
  if (blocks.length === 0) {
    blocks.push(
      {
        id: 'explore',
        title: 'Explore Programs',
        description: 'Browse available programs and enroll',
        icon: PlayCircle,
        action: 'Browse Programs',
        href: '/programs',
      },
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your details to personalize your experience',
        icon: Target,
        action: 'Update Profile',
        href: '/settings',
      }
    );
  }

  return (
    <div className="mb-6 lg:mb-0">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl text-sidebar-foreground flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-accent" />
          Up Next
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Your next actions to keep momentum going
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {blocks.slice(0, 4).map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              onClick={() => block.href && router.push(block.href)}
              className="bg-card border border-border rounded-lg p-4 sm:p-5 hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm mb-1 truncate">{block.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                    {block.description}
                  </p>

                  {block.progress !== undefined && (
                    <div className="mb-3 sm:mb-4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${block.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {block.progress}% complete
                      </div>
                    </div>
                  )}

                  <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    {block.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
