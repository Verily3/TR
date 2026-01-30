import { useState } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, Users, MessageSquare } from "lucide-react";
import { SessionCard } from "@/app/components/coaching/SessionCard";
import { DirectReportCard } from "@/app/components/coaching/DirectReportCard";
import { ActionItemCard } from "@/app/components/coaching/ActionItemCard";

type ViewMode = "upcoming" | "team" | "history";

// Mock data
const mockUpcomingSessions = [
  {
    id: "s1",
    directReport: {
      id: "dr1",
      name: "Sarah Chen",
      title: "Senior Product Manager",
      avatar: "SC",
    },
    scheduledDate: "Jan 15, 2026",
    scheduledTime: "10:00 AM",
    duration: 30,
    isPrepared: true,
    lastSession: "Jan 8, 2026",
    context: {
      goalsOnTrack: 2,
      goalsAtRisk: 1,
      programProgress: 45,
      recentWin: "Launched new feature ahead of schedule",
      concern: "Customer satisfaction score dropped 5%",
    },
  },
  {
    id: "s2",
    directReport: {
      id: "dr2",
      name: "Marcus Rodriguez",
      title: "Engineering Lead",
      avatar: "MR",
    },
    scheduledDate: "Jan 15, 2026",
    scheduledTime: "2:00 PM",
    duration: 30,
    isPrepared: false,
    lastSession: "Jan 8, 2026",
    context: {
      goalsOnTrack: 3,
      goalsAtRisk: 0,
      programProgress: 72,
      recentWin: "Team velocity increased 15%",
      concern: null,
    },
  },
  {
    id: "s3",
    directReport: {
      id: "dr3",
      name: "Emily Johnson",
      title: "Sales Director",
      avatar: "EJ",
    },
    scheduledDate: "Jan 16, 2026",
    scheduledTime: "9:00 AM",
    duration: 30,
    isPrepared: false,
    lastSession: "Jan 9, 2026",
    context: {
      goalsOnTrack: 1,
      goalsAtRisk: 2,
      programProgress: 28,
      recentWin: "Closed 3 major accounts this week",
      concern: "Behind on leadership program completion",
    },
  },
  {
    id: "s4",
    directReport: {
      id: "dr4",
      name: "David Kim",
      title: "Operations Manager",
      avatar: "DK",
    },
    scheduledDate: "Jan 17, 2026",
    scheduledTime: "11:00 AM",
    duration: 30,
    isPrepared: false,
    lastSession: "Jan 10, 2026",
    context: {
      goalsOnTrack: 2,
      goalsAtRisk: 1,
      programProgress: 60,
      recentWin: "Reduced operational costs by 12%",
      concern: "Team engagement score needs attention",
    },
  },
];

const mockDirectReports = [
  {
    id: "dr1",
    name: "Sarah Chen",
    title: "Senior Product Manager",
    avatar: "SC",
    nextSession: "Jan 15, 10:00 AM",
    lastSession: "Jan 8, 2026",
    goalsOnTrack: 2,
    goalsAtRisk: 1,
    programProgress: 45,
    programTitle: "Product Leadership Essentials",
    keyMetrics: [
      { label: "Customer Sat", value: "82%", trend: "down" as const },
      { label: "Feature Velocity", value: "23", trend: "up" as const },
    ],
  },
  {
    id: "dr2",
    name: "Marcus Rodriguez",
    title: "Engineering Lead",
    avatar: "MR",
    nextSession: "Jan 15, 2:00 PM",
    lastSession: "Jan 8, 2026",
    goalsOnTrack: 3,
    goalsAtRisk: 0,
    programProgress: 72,
    programTitle: "Technical Leadership",
    keyMetrics: [
      { label: "Team Velocity", value: "87", trend: "up" as const },
      { label: "Code Quality", value: "94%", trend: "stable" as const },
    ],
  },
  {
    id: "dr3",
    name: "Emily Johnson",
    title: "Sales Director",
    avatar: "EJ",
    nextSession: "Jan 16, 9:00 AM",
    lastSession: "Jan 9, 2026",
    goalsOnTrack: 1,
    goalsAtRisk: 2,
    programProgress: 28,
    programTitle: "Sales Leadership Certification",
    keyMetrics: [
      { label: "Revenue", value: "$2.4M", trend: "up" as const },
      { label: "Pipeline", value: "$8.2M", trend: "down" as const },
    ],
  },
  {
    id: "dr4",
    name: "David Kim",
    title: "Operations Manager",
    avatar: "DK",
    nextSession: "Jan 17, 11:00 AM",
    lastSession: "Jan 10, 2026",
    goalsOnTrack: 2,
    goalsAtRisk: 1,
    programProgress: 60,
    programTitle: "Operational Excellence",
    keyMetrics: [
      { label: "Efficiency", value: "91%", trend: "up" as const },
      { label: "Team NPS", value: "72", trend: "down" as const },
    ],
  },
];

const mockActionItems = [
  {
    id: "a1",
    directReport: "Sarah Chen",
    avatar: "SC",
    action: "Review Q1 product roadmap priorities",
    dueDate: "Jan 18, 2026",
    isOverdue: false,
    sessionDate: "Jan 8, 2026",
    status: "pending" as const,
  },
  {
    id: "a2",
    directReport: "Emily Johnson",
    avatar: "EJ",
    action: "Complete Module 2 of leadership program",
    dueDate: "Jan 12, 2026",
    isOverdue: true,
    sessionDate: "Jan 9, 2026",
    status: "overdue" as const,
  },
  {
    id: "a3",
    directReport: "David Kim",
    avatar: "DK",
    action: "Schedule team engagement focus group",
    dueDate: "Jan 15, 2026",
    isOverdue: false,
    sessionDate: "Jan 10, 2026",
    status: "pending" as const,
  },
  {
    id: "a4",
    directReport: "Marcus Rodriguez",
    avatar: "MR",
    action: "Document new code review process",
    dueDate: "Jan 14, 2026",
    isOverdue: false,
    sessionDate: "Jan 8, 2026",
    status: "completed" as const,
  },
];

export function CoachingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");

  // Stats
  const totalDirectReports = mockDirectReports.length;
  const sessionsThisWeek = mockUpcomingSessions.length;
  const preparedSessions = mockUpcomingSessions.filter((s) => s.isPrepared).length;
  const overdueActions = mockActionItems.filter((a) => a.isOverdue).length;
  const completionRate = 95; // Mock 1:1 completion rate

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-sidebar-foreground mb-2">Coaching</h1>
          <p className="text-muted-foreground">
            Develop your team through structured 1:1 conversations and accountability
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Direct Reports</div>
            <div className="text-2xl text-sidebar-foreground">{totalDirectReports}</div>
          </div>
          <div className="bg-card border border-blue-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Sessions This Week</div>
            <div className="text-2xl text-blue-600">{sessionsThisWeek}</div>
          </div>
          <div className="bg-card border border-green-200 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">1:1 Completion Rate</div>
            <div className="text-2xl text-green-600">{completionRate}%</div>
          </div>
          <div className="bg-card border border-accent/20 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Sessions Prepared</div>
            <div className="text-2xl text-accent">{preparedSessions}/{sessionsThisWeek}</div>
          </div>
          <div className={`bg-card border rounded-lg p-4 ${overdueActions > 0 ? 'border-red-200' : 'border-border'}`}>
            <div className="text-xs text-muted-foreground mb-1">Overdue Actions</div>
            <div className={`text-2xl ${overdueActions > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {overdueActions}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            {[
              { value: "upcoming", label: "Upcoming Sessions", icon: Calendar },
              { value: "team", label: "My Team", icon: Users },
              { value: "history", label: "Action Items", icon: CheckCircle2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setViewMode(tab.value as ViewMode)}
                  className={`px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                    viewMode === tab.value
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-background"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Needs Attention Section - Only show if there are overdue actions */}
        {overdueActions > 0 && viewMode === "upcoming" && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sidebar-foreground mb-1">Needs Attention</h3>
                <p className="text-sm text-muted-foreground">
                  {overdueActions} follow-up {overdueActions === 1 ? "action" : "actions"} overdue from previous sessions
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {mockActionItems
                .filter((item) => item.isOverdue)
                .map((item) => (
                  <ActionItemCard key={item.id} item={item} compact />
                ))}
            </div>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === "upcoming" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sidebar-foreground">This Week's Sessions</h2>
              <div className="text-sm text-muted-foreground">
                {preparedSessions} of {sessionsThisWeek} prepared
              </div>
            </div>
            <div className="space-y-4">
              {mockUpcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {viewMode === "team" && (
          <div>
            <div className="mb-4">
              <h2 className="text-sidebar-foreground">Direct Reports</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mockDirectReports.map((report) => (
                <DirectReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}

        {viewMode === "history" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sidebar-foreground">Follow-up Actions</h2>
              <div className="text-sm text-muted-foreground">
                {mockActionItems.filter(a => a.status === 'completed').length} of {mockActionItems.length} completed
              </div>
            </div>
            <div className="space-y-3">
              {mockActionItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
