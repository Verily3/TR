"use client";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Target,
  Download,
  Calendar,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock analytics data
const portfolioMetrics = [
  { label: "Total Enrollments", value: "1,248", change: "+12%", trend: "up" },
  { label: "Avg Completion Rate", value: "78%", change: "+5%", trend: "up" },
  { label: "Avg Engagement", value: "84%", change: "-2%", trend: "down" },
  { label: "Active Programs", value: "34", change: "+3", trend: "up" },
];

const clientPerformance = [
  { name: "TechStart Inc", enrollments: 124, completion: 85, engagement: 87 },
  { name: "Acme Corporation", enrollments: 48, completion: 82, engagement: 92 },
  { name: "Global Manufacturing", enrollments: 89, completion: 68, engagement: 64 },
  { name: "Summit Partners", enrollments: 36, completion: 91, engagement: 91 },
  { name: "Innovate Labs", enrollments: 12, completion: 75, engagement: 78 },
];

const programPerformance = [
  { name: "LeaderShift", clients: 5, enrollments: 156, completion: 82 },
  { name: "Executive Excellence", clients: 3, enrollments: 89, completion: 78 },
  { name: "New Manager Foundations", clients: 8, enrollments: 234, completion: 85 },
  { name: "Team Collaboration", clients: 4, enrollments: 112, completion: 71 },
];

const assessmentInsights = [
  { competency: "Strategic Thinking", baseline: 3.2, followUp: 3.8, improvement: "+19%" },
  { competency: "Communication", baseline: 3.5, followUp: 4.1, improvement: "+17%" },
  { competency: "Decision Making", baseline: 3.1, followUp: 3.5, improvement: "+13%" },
  { competency: "Collaboration", baseline: 3.8, followUp: 4.2, improvement: "+11%" },
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-sidebar-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Cross-account reporting and portfolio insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {portfolioMetrics.map((metric) => (
          <Card key={metric.label} className="hover:border-accent/30 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className={`flex items-center text-sm ${
                  metric.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {/* Client Performance */}
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Client Performance
            </CardTitle>
            <CardDescription>Enrollments, completion, and engagement by client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientPerformance.map((client) => (
                <div key={client.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{client.name}</span>
                    <span className="text-sm text-muted-foreground">{client.enrollments} enrolled</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Completion</span>
                        <span>{client.completion}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${client.completion}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Engagement</span>
                        <span>{client.engagement}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            client.engagement >= 80 ? "bg-accent" :
                            client.engagement >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${client.engagement}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Program Performance */}
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Program Performance
            </CardTitle>
            <CardDescription>Programs running across clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programPerformance.map((program) => (
                <div key={program.name} className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/30 transition-all">
                  <div>
                    <p className="font-medium">{program.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {program.clients} clients · {program.enrollments} enrollments
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{program.completion}%</p>
                    <p className="text-xs text-muted-foreground">completion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Insights */}
      <Card className="hover:border-accent/30 transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Assessment Insights
          </CardTitle>
          <CardDescription>
            Average scores by competency: baseline vs follow-up assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {assessmentInsights.map((insight) => (
              <div key={insight.competency} className="p-4 rounded-lg border hover:border-accent/30 transition-all">
                <p className="text-sm font-medium mb-3">{insight.competency}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Baseline</p>
                    <p className="text-lg font-semibold">{insight.baseline}</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-5 w-5 text-green-500 mx-auto" />
                    <p className="text-xs text-green-600 font-medium">{insight.improvement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                    <p className="text-lg font-semibold">{insight.followUp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
