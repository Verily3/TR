"use client";

import {
  BookOpen,
  Target,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useCurrentTenant } from "@/stores/auth-store";
import { usePrograms, useGoalStats, useTenantMembers } from "@/hooks/api";

export default function DashboardPage() {
  const user = useUser();
  const tenant = useCurrentTenant();
  const tenantId = tenant?.id || null;

  // Fetch real data
  const { data: programsData, isLoading: programsLoading } = usePrograms(tenantId, {
    perPage: 100,
  });
  const { data: goalStats, isLoading: goalsLoading } = useGoalStats(tenantId);
  const { data: membersData, isLoading: membersLoading } = useTenantMembers(tenantId, {
    perPage: 100,
  });

  const isLoading = programsLoading || goalsLoading || membersLoading;

  // Calculate stats from real data
  const activePrograms = programsData?.items.filter(
    (p) => p.status === "active"
  ).length ?? 0;
  const inProgressPrograms = programsData?.items.filter(
    (p) => p.status === "active" && p.enrollmentCount > 0
  ).length ?? 0;

  const totalGoals = goalStats?.total ?? 0;
  const onTrackGoals = goalStats?.onTrack ?? 0;

  const totalMembers = membersData?.meta.total ?? 0;

  // Calculate completion rate from goals
  const completionRate = totalGoals > 0
    ? Math.round((goalStats?.completed ?? 0) / totalGoals * 100)
    : 0;

  const stats = [
    {
      title: "Active Programs",
      value: isLoading ? "..." : String(activePrograms),
      description: isLoading ? "Loading..." : `${inProgressPrograms} in progress`,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Goals",
      value: isLoading ? "..." : String(totalGoals),
      description: isLoading ? "Loading..." : `${onTrackGoals} on track`,
      icon: Target,
      color: "text-green-500",
    },
    {
      title: "Team Members",
      value: isLoading ? "..." : String(totalMembers),
      description: isLoading ? "Loading..." : "Active members",
      icon: Users,
      color: "text-purple-500",
    },
    {
      title: "Goal Completion",
      value: isLoading ? "..." : `${completionRate}%`,
      description: isLoading ? "Loading..." : `${goalStats?.completed ?? 0} completed`,
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  // TODO: Fetch these from API when coaching/scheduling routes exist
  const upcomingItems = [
    {
      title: "Leadership Workshop",
      type: "Program",
      date: "Today, 2:00 PM",
      icon: BookOpen,
    },
    {
      title: "1:1 with Sarah",
      type: "Coaching",
      date: "Tomorrow, 10:00 AM",
      icon: Calendar,
    },
    {
      title: "Q1 Goals Review",
      type: "Review",
      date: "Jan 25, 3:00 PM",
      icon: Target,
    },
  ];

  // TODO: Fetch from activity/audit log API
  const recentActivity = [
    {
      action: "Completed lesson",
      item: "Effective Communication",
      time: "2 hours ago",
    },
    {
      action: "Updated goal",
      item: "Increase team productivity",
      time: "Yesterday",
    },
    {
      action: "Submitted assessment",
      item: "360 Feedback",
      time: "2 days ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening in {tenant?.name || "your organization"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.type} • {item.date}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="font-medium">
                    {activity.action}: {activity.item}
                  </p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
