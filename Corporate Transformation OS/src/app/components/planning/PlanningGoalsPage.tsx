import { useState } from "react";
import { Calendar, Target, TrendingUp, Plus, ChevronRight, Circle, CheckCircle2, AlertCircle, Clock, Users, DollarSign, Factory, Award, Filter } from "lucide-react";
import { NewGoalModal } from "@/app/components/planning/NewGoalModal";

type Tab = "annual" | "quarterly" | "goals" | "metrics";

export function PlanningGoalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("annual");
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sidebar-foreground mb-2">Planning & Goals</h1>
              <p className="text-muted-foreground">
                Strategic planning, quarterly execution, and goal tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted/30 transition-colors">
                <Filter className="w-4 h-4 inline mr-2" />
                Filter
              </button>
              <button 
                onClick={() => setIsNewGoalModalOpen(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Goal
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-border">
          <div className="flex gap-6">
            {[
              { id: "annual" as Tab, label: "Annual Planning", icon: Calendar },
              { id: "quarterly" as Tab, label: "Quarterly Planning", icon: Target },
              { id: "goals" as Tab, label: "Goals", icon: CheckCircle2 },
              { id: "metrics" as Tab, label: "Metrics & KPIs", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-sidebar-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "annual" && <AnnualPlanningTab />}
        {activeTab === "quarterly" && <QuarterlyPlanningTab />}
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "metrics" && <MetricsTab />}
      </div>

      {/* New Goal Modal */}
      <NewGoalModal isOpen={isNewGoalModalOpen} onClose={() => setIsNewGoalModalOpen(false)} />
    </div>
  );
}

function AnnualPlanningTab() {
  return (
    <div>
      {/* Planning Year Header */}
      <div className="mb-8 bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sidebar-foreground mb-2">2026 Annual Plan</h2>
            <p className="text-sm text-muted-foreground">Strategic priorities and objectives for the fiscal year</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">PLAN COMPLETION</div>
            <div className="text-3xl text-sidebar-foreground mb-1">68%</div>
            <div className="text-xs text-muted-foreground">8 of 12 quarters complete</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: "68%" }} />
        </div>
      </div>

      {/* Strategic Pillars */}
      <div className="mb-8">
        <h3 className="text-sidebar-foreground mb-4">Strategic Pillars</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              title: "Profitable Growth",
              target: "$250M Revenue | 12% EBITDA",
              progress: 72,
              initiatives: 8,
              status: "on-track",
            },
            {
              title: "Operational Excellence",
              target: "85% OEE | <2% Waste",
              progress: 58,
              initiatives: 6,
              status: "at-risk",
            },
            {
              title: "Market Leadership",
              target: "20% Market Share | Top 3 Brand",
              progress: 65,
              initiatives: 5,
              status: "on-track",
            },
          ].map((pillar, index) => (
            <div
              key={index}
              className={`bg-card border rounded-lg p-6 ${
                pillar.status === "on-track" ? "border-green-200" : "border-yellow-200"
              }`}
            >
              <h4 className="text-sidebar-foreground mb-2">{pillar.title}</h4>
              <p className="text-xs text-muted-foreground mb-4">{pillar.target}</p>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{pillar.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pillar.status === "on-track" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${pillar.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{pillar.initiatives} initiatives</span>
                <span
                  className={pillar.status === "on-track" ? "text-green-600" : "text-yellow-600"}
                >
                  {pillar.status === "on-track" ? "On Track" : "At Risk"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Annual Objectives */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sidebar-foreground">Annual Objectives</h3>
          <button className="text-sm text-accent hover:text-accent/80 transition-colors">
            View All (24)
          </button>
        </div>
        <div className="space-y-3">
          {[
            {
              objective: "Achieve $250M in total revenue with balanced growth across raw and cooked segments",
              owner: "CEO",
              category: "Financial",
              progress: 78,
              status: "on-track",
              quarters: ["Q1", "Q2", "Q3", "Q4"],
              activeQuarter: "Q1",
            },
            {
              objective: "Expand national distribution to 9,000+ retail points",
              owner: "CMO",
              category: "Market Growth",
              progress: 62,
              status: "on-track",
              quarters: ["Q1", "Q2", "Q3", "Q4"],
              activeQuarter: "Q2",
            },
            {
              objective: "Improve plant OEE to 85% across all facilities",
              owner: "COO",
              category: "Operational",
              progress: 54,
              status: "at-risk",
              quarters: ["Q1", "Q2", "Q3", "Q4"],
              activeQuarter: "Q1",
            },
            {
              objective: "Build executive bench strength - 80% A-players in leadership",
              owner: "CEO",
              category: "People",
              progress: 70,
              status: "on-track",
              quarters: ["Q1", "Q2", "Q3", "Q4"],
              activeQuarter: "Q3",
            },
            {
              objective: "Launch 3 new value-added product lines with >$5M revenue each",
              owner: "CMO",
              category: "Innovation",
              progress: 45,
              status: "needs-attention",
              quarters: ["Q2", "Q3", "Q4"],
              activeQuarter: "Q2",
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`bg-card border rounded-lg p-5 hover:border-accent/50 transition-colors cursor-pointer ${
                item.status === "on-track"
                  ? "border-border"
                  : item.status === "at-risk"
                  ? "border-yellow-200"
                  : "border-accent/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm text-sidebar-foreground">{item.objective}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.owner}
                    </span>
                    <span className="px-2 py-1 bg-muted rounded text-xs">{item.category}</span>
                    <span className="flex items-center gap-1">
                      {item.quarters.map((q, qIndex) => (
                        <span
                          key={qIndex}
                          className={`px-2 py-1 rounded text-xs ${
                            q === item.activeQuarter
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted/50"
                          }`}
                        >
                          {q}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <div className="text-2xl text-sidebar-foreground mb-1">{item.progress}%</div>
                  <div
                    className={`text-xs ${
                      item.status === "on-track"
                        ? "text-green-600"
                        : item.status === "at-risk"
                        ? "text-yellow-600"
                        : "text-accent"
                    }`}
                  >
                    {item.status === "on-track"
                      ? "On Track"
                      : item.status === "at-risk"
                      ? "At Risk"
                      : "Needs Attention"}
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.status === "on-track"
                      ? "bg-green-500"
                      : item.status === "at-risk"
                      ? "bg-yellow-500"
                      : "bg-accent"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuarterlyPlanningTab() {
  return (
    <div>
      {/* Quarter Selector */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
            <option>Q1 2026</option>
            <option>Q2 2026</option>
            <option>Q3 2026</option>
            <option>Q4 2026</option>
          </select>
          <div className="text-sm text-muted-foreground">January 1 - March 31, 2026</div>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
          Start Q2 Planning
        </button>
      </div>

      {/* Quarter Overview */}
      <div className="mb-8 bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-muted-foreground mb-2">QUARTERLY THEME</div>
            <div className="text-sm text-sidebar-foreground">Foundation & Momentum</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">PRIORITIES</div>
            <div className="text-sm text-sidebar-foreground">12 Active</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">ACTION ITEMS</div>
            <div className="text-sm text-sidebar-foreground">47 Total • 32 Complete</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">COMPLETION</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "68%" }} />
              </div>
              <span className="text-sm text-sidebar-foreground">68%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Priorities */}
      <div className="mb-8">
        <h3 className="text-sidebar-foreground mb-4">Q1 2026 Priorities</h3>
        <div className="space-y-4">
          {[
            {
              priority: "Complete operational audit and implement Q1 efficiency improvements",
              category: "Operational Excellence",
              owner: "President/COO - Sarah Mitchell",
              dueDate: "Mar 31, 2026",
              actions: 8,
              completed: 6,
              status: "on-track",
            },
            {
              priority: "Launch national marketing campaign for cooked product line",
              category: "Market Leadership",
              owner: "CMO - Jennifer Lopez",
              dueDate: "Feb 28, 2026",
              actions: 12,
              completed: 10,
              status: "on-track",
            },
            {
              priority: "Close acquisition of regional distributor to expand market reach",
              category: "Profitable Growth",
              owner: "CEO - You",
              dueDate: "Mar 15, 2026",
              actions: 6,
              completed: 3,
              status: "at-risk",
            },
            {
              priority: "Execute LeaderShift program with top 25 leaders",
              category: "People & Culture",
              owner: "CEO - You",
              dueDate: "Mar 31, 2026",
              actions: 5,
              completed: 4,
              status: "on-track",
            },
          ].map((item, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-sm text-sidebar-foreground mb-3">{item.priority}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded">{item.category}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.dueDate}
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs ${
                      item.status === "on-track"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {item.status === "on-track" ? "On Track" : "At Risk"}
                  </span>
                </div>
              </div>

              {/* Action Items */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Action Items</span>
                  <span>
                    {item.completed} of {item.actions} complete
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(item.completed / item.actions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Expandable Action Items */}
              <button className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors">
                <span>View action items</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Action Items */}
      <div>
        <h3 className="text-sidebar-foreground mb-4">This Week's Action Items</h3>
        <div className="space-y-2">
          {[
            { task: "Review and approve Q1 marketing budget allocation", owner: "CMO", dueDate: "Jan 17", done: false },
            { task: "Finalize acquisition due diligence report", owner: "CFO", dueDate: "Jan 18", done: false },
            { task: "Conduct LeaderShift Module 3 session with leadership team", owner: "You", dueDate: "Jan 16", done: true },
            { task: "Review plant efficiency metrics with COO", owner: "You", dueDate: "Jan 19", done: false },
            { task: "Approve new product launch timeline", owner: "CMO", dueDate: "Jan 20", done: false },
            { task: "Meet with board compensation committee", owner: "You", dueDate: "Jan 18", done: true },
          ].map((item, index) => (
            <div
              key={index}
              className={`bg-card border border-border rounded-lg p-4 flex items-center gap-4 ${
                item.done ? "opacity-50" : ""
              }`}
            >
              <button
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  item.done ? "bg-accent border-accent" : "border-border"
                }`}
              >
                {item.done && <CheckCircle2 className="w-4 h-4 text-accent-foreground" />}
              </button>
              <div className="flex-1">
                <div className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-sidebar-foreground"}`}>
                  {item.task}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{item.owner}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {item.dueDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalsTab() {
  return (
    <div>
      {/* Goals Summary */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs text-muted-foreground mb-2">TOTAL GOALS</div>
          <div className="text-3xl text-sidebar-foreground mb-1">18</div>
          <div className="text-xs text-green-600">+3 this quarter</div>
        </div>
        <div className="bg-card border border-green-200 rounded-lg p-5">
          <div className="text-xs text-muted-foreground mb-2">ON TRACK</div>
          <div className="text-3xl text-green-600 mb-1">12</div>
          <div className="text-xs text-muted-foreground">67% of total</div>
        </div>
        <div className="bg-card border border-yellow-200 rounded-lg p-5">
          <div className="text-xs text-muted-foreground mb-2">AT RISK</div>
          <div className="text-3xl text-yellow-600 mb-1">4</div>
          <div className="text-xs text-muted-foreground">22% of total</div>
        </div>
        <div className="bg-card border border-accent rounded-lg p-5">
          <div className="text-xs text-muted-foreground mb-2">NEEDS ATTENTION</div>
          <div className="text-3xl text-accent mb-1">2</div>
          <div className="text-xs text-muted-foreground">11% of total</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm">
          All Goals (18)
        </button>
        <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
          My Goals (8)
        </button>
        <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
          Team Goals (10)
        </button>
        <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
          Company Goals (6)
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {[
          {
            goal: "Increase EBITDA to $24M by end of Q1 2026",
            type: "Company",
            category: "Financial",
            owner: "CFO - Marcus Chen",
            progress: 78,
            current: "$22.8M",
            target: "$24M",
            dueDate: "Mar 31, 2026",
            status: "on-track",
            linkedTo: "Scorecard: Revenue & Profit Growth",
          },
          {
            goal: "Achieve 85% OEE across all manufacturing plants",
            type: "Company",
            category: "Operational",
            owner: "COO - Sarah Mitchell",
            progress: 54,
            current: "82.3%",
            target: "85%",
            dueDate: "Jun 30, 2026",
            status: "at-risk",
            linkedTo: "Scorecard: Operational Excellence",
          },
          {
            goal: "Complete LeaderShift program with 90%+ engagement",
            type: "Team",
            category: "People",
            owner: "You",
            progress: 82,
            current: "Module 7 of 9",
            target: "Module 9",
            dueDate: "Mar 15, 2026",
            status: "on-track",
            linkedTo: "Program: LeaderShift",
          },
          {
            goal: "Expand distribution to 9,000 retail points",
            type: "Company",
            category: "Market Growth",
            owner: "CMO - Jennifer Lopez",
            progress: 62,
            current: "8,420 points",
            target: "9,000 points",
            dueDate: "Dec 31, 2026",
            status: "on-track",
            linkedTo: "Scorecard: Brand Expansion",
          },
          {
            goal: "Launch 3 new value-added product SKUs",
            type: "Team",
            category: "Innovation",
            owner: "CMO - Jennifer Lopez",
            progress: 33,
            current: "1 launched",
            target: "3 products",
            dueDate: "Sep 30, 2026",
            status: "needs-attention",
            linkedTo: "Annual Plan: Innovation",
          },
          {
            goal: "Achieve 80% A-player rating in leadership team",
            type: "Personal",
            category: "People",
            owner: "You",
            progress: 78,
            current: "78%",
            target: "80%",
            dueDate: "Dec 31, 2026",
            status: "on-track",
            linkedTo: "Scorecard: Talent & Culture",
          },
        ].map((item, index) => (
          <div
            key={index}
            className={`bg-card border rounded-lg p-6 hover:border-accent/50 transition-colors cursor-pointer ${
              item.status === "on-track"
                ? "border-border"
                : item.status === "at-risk"
                ? "border-yellow-200"
                : "border-accent/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm text-sidebar-foreground">{item.goal}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="px-2 py-1 bg-muted rounded">{item.type}</span>
                  <span className="px-2 py-1 bg-muted rounded">{item.category}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {item.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.dueDate}
                  </span>
                </div>
                <div className="text-xs text-accent">{item.linkedTo}</div>
              </div>
              <div className="ml-6 text-right">
                <div className="text-2xl text-sidebar-foreground mb-1">{item.progress}%</div>
                <div
                  className={`text-xs mb-2 ${
                    item.status === "on-track"
                      ? "text-green-600"
                      : item.status === "at-risk"
                      ? "text-yellow-600"
                      : "text-accent"
                  }`}
                >
                  {item.status === "on-track"
                    ? "On Track"
                    : item.status === "at-risk"
                    ? "At Risk"
                    : "Needs Attention"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.current} / {item.target}
                </div>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.status === "on-track"
                    ? "bg-green-500"
                    : item.status === "at-risk"
                    ? "bg-yellow-500"
                    : "bg-accent"
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsTab() {
  return (
    <div>
      {/* Metrics Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sidebar-foreground">KPI Performance Dashboard</h3>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-sidebar-foreground">
              <option>Q1 2026</option>
              <option>Q4 2025</option>
              <option>Q3 2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-accent" />
          <h4 className="text-sm text-sidebar-foreground">Financial Performance</h4>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Revenue", current: "$62.5M", target: "$62M", change: "+0.8%", trend: "up", unit: "Quarterly" },
            { label: "EBITDA", current: "$24.5M", target: "$23M", change: "+6.5%", trend: "up", unit: "Annual Run Rate" },
            { label: "Net Margin", current: "8.2%", target: "8.0%", change: "+0.3%", trend: "up", unit: "%" },
            { label: "ROIC", current: "14.8%", target: "15%", change: "-0.5%", trend: "down", unit: "%" },
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-2">{metric.label}</div>
              <div className="text-2xl text-sidebar-foreground mb-2">{metric.current}</div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-muted-foreground">Target: {metric.target}</span>
                <span className={metric.trend === "up" ? "text-green-600" : "text-accent"}>
                  {metric.change}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{metric.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Factory className="w-5 h-5 text-accent" />
          <h4 className="text-sm text-sidebar-foreground">Operational Efficiency</h4>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Plant OEE", current: "82.3%", target: "85%", change: "-2.7%", trend: "down" },
            { label: "Product Yield", current: "94.1%", target: "95%", change: "0%", trend: "neutral" },
            { label: "Throughput/Shift", current: "12.8K lbs", target: "13K lbs", change: "+3%", trend: "up" },
            { label: "Downtime Hours", current: "124hrs", target: "<100hrs", change: "+24%", trend: "down" },
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-2">{metric.label}</div>
              <div className="text-2xl text-sidebar-foreground mb-2">{metric.current}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target: {metric.target}</span>
                <span
                  className={
                    metric.trend === "up"
                      ? "text-green-600"
                      : metric.trend === "down"
                      ? "text-accent"
                      : "text-muted-foreground"
                  }
                >
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* People & Culture Metrics */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent" />
          <h4 className="text-sm text-sidebar-foreground">People & Culture</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "A-Player %", current: "78%", target: "80%", change: "+5%", trend: "up" },
            { label: "Engagement Score", current: "87%", target: "85%", change: "+2%", trend: "up" },
            { label: "Leadership Retention", current: "92%", target: "90%", trend: "up", change: "+2%" },
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-2">{metric.label}</div>
              <div className="text-2xl text-sidebar-foreground mb-2">{metric.current}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target: {metric.target}</span>
                <span className="text-green-600">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Growth Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent" />
          <h4 className="text-sm text-sidebar-foreground">Market Growth</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Market Share", current: "18.2%", target: "20%", change: "+1.5%", trend: "up" },
            { label: "Distribution Points", current: "8,420", target: "9,000", change: "+12%", trend: "up" },
            { label: "Brand NPS", current: "67", target: "70", change: "+5", trend: "up" },
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-2">{metric.label}</div>
              <div className="text-2xl text-sidebar-foreground mb-2">{metric.current}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target: {metric.target}</span>
                <span className="text-green-600">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}