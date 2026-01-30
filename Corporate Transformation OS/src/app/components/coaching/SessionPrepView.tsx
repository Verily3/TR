import { ArrowLeft, Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, BookOpen, Target, MessageSquare, Plus } from "lucide-react";

interface SessionPrepViewProps {
  onBack: () => void;
}

export function SessionPrepView({ onBack }: SessionPrepViewProps) {
  // Mock data for Sarah Chen's 1:1
  const session = {
    directReport: {
      name: "Sarah Chen",
      title: "Senior Product Manager",
      avatar: "SC",
    },
    scheduledDate: "Jan 15, 2026",
    scheduledTime: "10:00 AM",
    duration: 30,
    lastSession: "Jan 8, 2026",
  };

  const contextData = {
    goals: [
      {
        id: "g1",
        title: "Complete leadership certification",
        status: "on-track" as const,
        progress: 45,
        deadline: "Mar 31, 2026",
      },
      {
        id: "g2",
        title: "Increase team engagement score to 85",
        status: "on-track" as const,
        progress: 78,
        currentValue: "82",
        target: "85",
      },
      {
        id: "g3",
        title: "Launch 3 major features in Q1",
        status: "at-risk" as const,
        progress: 33,
        currentValue: "1 launched",
        target: "3 features",
        concern: "Feature 2 delayed by 2 weeks",
      },
    ],
    program: {
      title: "Product Leadership Essentials",
      progress: 45,
      currentModule: "Module 4: Strategic Prioritization",
      status: "Behind schedule - Module 2 incomplete",
      isAtRisk: true,
    },
    metrics: [
      {
        label: "Customer Satisfaction",
        value: "82%",
        previousValue: "87%",
        trend: "down" as const,
        concern: "Dropped 5% in last 2 weeks",
      },
      {
        label: "Feature Velocity",
        value: "23 stories/sprint",
        previousValue: "20 stories/sprint",
        trend: "up" as const,
      },
      {
        label: "Team Engagement",
        value: "82",
        previousValue: "78",
        trend: "up" as const,
      },
    ],
    recentWins: [
      "Launched new dashboard feature ahead of schedule",
      "Improved team velocity by 15%",
      "Successful stakeholder presentation on Q1 roadmap",
    ],
    followUpItems: [
      {
        id: "f1",
        action: "Review Q1 product roadmap priorities",
        dueDate: "Jan 18, 2026",
        status: "pending" as const,
      },
    ],
  };

  const conversationFrameworks = [
    {
      id: "grow",
      name: "GROW Model",
      description: "Goal, Reality, Options, Way Forward",
      recommended: true,
    },
    {
      id: "feedback",
      name: "Feedback Conversation",
      description: "Structured feedback and development",
      recommended: false,
    },
    {
      id: "performance",
      name: "Performance Check-in",
      description: "Goals, progress, and obstacles",
      recommended: false,
    },
    {
      id: "development",
      name: "Career Development",
      description: "Growth, aspirations, and support",
      recommended: false,
    },
  ];

  const suggestedTopics = [
    "Customer satisfaction drop - root cause and action plan",
    "Feature 2 delay - blockers and resource needs",
    "Leadership program completion - schedule and support",
    "Recent wins - recognition and what's working well",
  ];

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1200px] mx-auto p-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coaching
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-medium">
                {session.directReport.avatar}
              </div>
              <div>
                <h1 className="text-sidebar-foreground mb-1">
                  1:1 with {session.directReport.name}
                </h1>
                <p className="text-muted-foreground">{session.directReport.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-sidebar-foreground flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {session.scheduledDate}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {session.scheduledTime} ({session.duration} min)
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              Start Session
            </button>
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors">
              Reschedule
            </button>
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors">
              View History
            </button>
          </div>
        </div>

        {/* Contextual Preparation */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Goals Status */}
          <div className="col-span-2 bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="text-sidebar-foreground">Goals Status</h2>
            </div>
            <div className="space-y-3">
              {contextData.goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border ${
                    goal.status === "at-risk"
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-sidebar-foreground mb-1">{goal.title}</div>
                      {goal.currentValue && (
                        <div className="text-xs text-muted-foreground">
                          Current: {goal.currentValue} → Target: {goal.target}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        goal.status === "at-risk"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {goal.status === "at-risk" ? "At Risk" : "On Track"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          goal.status === "at-risk" ? "bg-red-600" : "bg-green-600"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                  </div>
                  {goal.concern && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-red-700">{goal.concern}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sidebar-foreground mb-4">Key Metrics</h3>
            <div className="space-y-4">
              {contextData.metrics.map((metric, index) => (
                <div key={index}>
                  <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-sidebar-foreground">{metric.value}</span>
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : metric.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Previous: {metric.previousValue}
                  </div>
                  {metric.concern && (
                    <div className="text-xs text-red-600 mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {metric.concern}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Program Progress */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-sidebar-foreground">Program Progress</h2>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="text-sm text-sidebar-foreground mb-2">{contextData.program.title}</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${contextData.program.progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{contextData.program.progress}%</span>
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                Current: {contextData.program.currentModule}
              </div>
              {contextData.program.isAtRisk && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{contextData.program.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Wins & Follow-ups */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Recent Wins */}
          <div className="bg-card border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sidebar-foreground">Recent Wins</h3>
            </div>
            <ul className="space-y-2">
              {contextData.recentWins.map((win, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-sidebar-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {win}
                </li>
              ))}
            </ul>
          </div>

          {/* Follow-up Items */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="text-sidebar-foreground">Follow-up from Last Session</h3>
            </div>
            {contextData.followUpItems.length > 0 ? (
              <div className="space-y-2">
                {contextData.followUpItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sidebar-foreground">{item.action}</div>
                      <div className="text-xs text-muted-foreground">Due {item.dueDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending items</p>
            )}
          </div>
        </div>

        {/* Conversation Framework */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-sidebar-foreground">Choose Conversation Framework</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {conversationFrameworks.map((framework) => (
              <button
                key={framework.id}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  framework.recommended
                    ? "border-accent bg-accent/5 hover:bg-accent/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="text-sm text-sidebar-foreground mb-1">{framework.name}</div>
                <div className="text-xs text-muted-foreground">{framework.description}</div>
                {framework.recommended && (
                  <div className="mt-2">
                    <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded">
                      Recommended
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Topics */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sidebar-foreground mb-4">Suggested Discussion Topics</h3>
          <ul className="space-y-2">
            {suggestedTopics.map((topic, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-sidebar-foreground">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  {index + 1}
                </div>
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
