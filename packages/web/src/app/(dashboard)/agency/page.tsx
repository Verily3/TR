"use client";

import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  Mail,
  CheckCircle2,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentAgency } from "@/stores/auth-store";
import { useAgencyStats, useAgencyTenants } from "@/hooks/api";

export default function AgencyDashboardPage() {
  const agency = useCurrentAgency();
  const agencyId = agency?.id || null;

  // Fetch real data from API
  const { data: stats, isLoading: statsLoading } = useAgencyStats(agencyId);
  const { data: tenantsData, isLoading: tenantsLoading } = useAgencyTenants(agencyId, { perPage: 5 });

  const tenants = tenantsData?.items || [];

  // Portfolio-level stats from API
  const portfolioStats = [
    {
      name: "Active Clients",
      value: statsLoading ? "..." : String(stats?.totalTenants || 0),
      change: "Managed accounts",
      trend: "up",
      icon: Building2,
    },
    {
      name: "Total Users",
      value: statsLoading ? "..." : String(stats?.totalUsers || 0),
      change: "Across all clients",
      trend: "up",
      icon: Users,
    },
    {
      name: "Programs Running",
      value: statsLoading ? "..." : String(stats?.totalPrograms || 0),
      change: "Across all clients",
      trend: "neutral",
      icon: BookOpen,
    },
    {
      name: "Avg Completion Rate",
      value: "—",
      change: "Coming soon",
      trend: "up",
      icon: CheckCircle2,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-yellow-500";
      case "trial":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return "bg-accent";
    if (engagement >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isLoading = statsLoading || tenantsLoading;

  // Calculate aggregate metrics from tenants
  const totalPendingInvites = tenants.reduce((sum, t) => sum + (t.pendingInvites || 0), 0);
  const clientsWithPendingInvites = tenants.filter(t => (t.pendingInvites || 0) > 0).length;

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-sidebar-foreground mb-2">Agency Overview</h1>
        <p className="text-muted-foreground">
          {agency?.name || "Agency"} portfolio dashboard. Monitor clients, programs, and engagement.
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {portfolioStats.map((stat) => (
          <Card key={stat.name} className="hover:border-accent/30 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.name}</p>
                  <p className="text-2xl font-semibold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Client Health Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Client Health</CardTitle>
            <CardDescription>
              Active users, programs, and engagement by client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No clients yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((client) => (
                  <div key={client.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(client.status)}`} />
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.users} users · {client.programs} programs
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">{client.engagement}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getEngagementColor(client.engagement)} transition-all`}
                        style={{ width: `${client.engagement}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Metrics */}
        <div className="space-y-4">
          <Card className="hover:border-accent/30 transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Invitation Acceptance</p>
                  <p className="text-2xl font-semibold mb-1">89%</p>
                  <p className="text-xs text-muted-foreground">1,112 of 1,248 invitations accepted</p>
                  <button className="text-xs text-accent flex items-center gap-1 mt-3 hover:gap-2 transition-all">
                    View details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Pending Invitations</p>
                  <p className="text-2xl font-semibold mb-1">
                    {tenantsLoading ? "..." : totalPendingInvites}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tenantsLoading ? "Loading..." : `Across ${clientsWithPendingInvites} clients`}
                  </p>
                  <button className="text-xs text-accent flex items-center gap-1 mt-3 hover:gap-2 transition-all">
                    Send reminders
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Assessment Insights</p>
                  <p className="text-2xl font-semibold mb-1">+12%</p>
                  <p className="text-xs text-muted-foreground">Avg improvement: baseline vs follow-up</p>
                  <button className="text-xs text-accent flex items-center gap-1 mt-3 hover:gap-2 transition-all">
                    View analytics
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New client onboarded", client: "Innovate Labs", time: "2 hours ago" },
              { action: "Program launched", client: "TechStart Inc", time: "5 hours ago" },
              { action: "Assessment completed", client: "Acme Corporation", time: "1 day ago" },
              { action: "Billing updated", client: "Summit Partners", time: "2 days ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.client}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
