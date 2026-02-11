"use client";

import { BarChart3, Download, Calendar, TrendingUp, Users, Clock } from "lucide-react";

export function ReportsTab() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">
              Program Reports
            </h2>
            <p className="text-muted-foreground">
              Analytics and insights on program performance and learner progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 bg-input border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-2xl font-medium text-sidebar-foreground">28</span>
            </div>
            <div className="text-sm text-muted-foreground">Total Enrolled</div>
            <div className="mt-2 text-xs text-green-600">+3 this week</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">67%</span>
            </div>
            <div className="text-sm text-muted-foreground">Avg. Completion</div>
            <div className="mt-2 text-xs text-green-600">+5% from last week</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">4.2h</span>
            </div>
            <div className="text-sm text-muted-foreground">Avg. Time Spent</div>
            <div className="mt-2 text-xs text-muted-foreground">per participant</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">9</span>
            </div>
            <div className="text-sm text-muted-foreground">Weeks Remaining</div>
            <div className="mt-2 text-xs text-muted-foreground">ends May 24, 2025</div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Completion Progress */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sidebar-foreground mb-4">Completion Progress</h3>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Over Time */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sidebar-foreground mb-4">Engagement Over Time</h3>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Performance */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sidebar-foreground mb-4">Module Performance</h3>
          <div className="space-y-4">
            {/* Module 1 */}
            <div className="flex items-center gap-4">
              <div className="w-64 text-sm text-sidebar-foreground">
                Module 1: Introduction to Leadership
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: "85%" }}
                />
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">85%</div>
            </div>

            {/* Module 2 */}
            <div className="flex items-center gap-4">
              <div className="w-64 text-sm text-sidebar-foreground">
                Module 2: Emotional Intelligence
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: "62%" }}
                />
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">62%</div>
            </div>

            {/* Module 3 */}
            <div className="flex items-center gap-4">
              <div className="w-64 text-sm text-sidebar-foreground">
                Module 3: Strategic Thinking
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: "28%" }}
                />
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">28%</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h3 className="text-sidebar-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
                SJ
              </div>
              <div className="flex-1">
                <div className="text-sm text-sidebar-foreground">
                  Sarah Johnson completed "What is Leadership?"
                </div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                MC
              </div>
              <div className="flex-1">
                <div className="text-sm text-sidebar-foreground">
                  Michael Chen started Module 2
                </div>
                <div className="text-xs text-muted-foreground">4 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                ED
              </div>
              <div className="flex-1">
                <div className="text-sm text-sidebar-foreground">
                  Emily Davis submitted self-assessment
                </div>
                <div className="text-xs text-muted-foreground">Yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
