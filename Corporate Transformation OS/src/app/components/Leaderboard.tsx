import { Trophy, TrendingUp, Award, Medal, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

type TimeFilter = "week" | "month" | "all";
type ViewType = "team" | "organization";

interface LeaderboardEntry {
  rank: number;
  name: string;
  role: string;
  points: number;
  progress: number;
  change: number; // +/- from previous period
  avatar: string;
  isCurrentUser?: boolean;
}

const teamLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "Sarah Chen",
    role: "Senior Manager",
    points: 12450,
    progress: 87,
    change: 2,
    avatar: "SC",
  },
  {
    rank: 2,
    name: "John Doe",
    role: "Executive",
    points: 11800,
    progress: 71,
    change: 1,
    avatar: "JD",
    isCurrentUser: true,
  },
  {
    rank: 3,
    name: "Michael Torres",
    role: "Director",
    points: 11200,
    progress: 68,
    change: -1,
    avatar: "MT",
  },
  {
    rank: 4,
    name: "Emma Williams",
    role: "Manager",
    points: 10850,
    progress: 65,
    change: 3,
    avatar: "EW",
  },
  {
    rank: 5,
    name: "David Park",
    role: "Team Lead",
    points: 10300,
    progress: 62,
    change: 0,
    avatar: "DP",
  },
  {
    rank: 6,
    name: "Lisa Johnson",
    role: "Manager",
    points: 9750,
    progress: 58,
    change: -2,
    avatar: "LJ",
  },
  {
    rank: 7,
    name: "Robert Kim",
    role: "Senior Manager",
    points: 9200,
    progress: 55,
    change: 1,
    avatar: "RK",
  },
  {
    rank: 8,
    name: "Amanda Foster",
    role: "Director",
    points: 8900,
    progress: 53,
    change: 0,
    avatar: "AF",
  },
];

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [viewType, setViewType] = useState<ViewType>("team");

  const currentUserEntry = teamLeaderboard.find((entry) => entry.isCurrentUser);
  const topThree = teamLeaderboard.slice(0, 3);
  const restOfLeaderboard = teamLeaderboard.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-600";
    if (rank === 2)
      return "bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30 text-gray-500";
    if (rank === 3)
      return "bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-600";
    return "bg-card border-border";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sidebar-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Track your progress against peers and goals</p>
        </div>

        <div className="flex gap-2">
          {/* View Type Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewType("team")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                viewType === "team" ? "bg-card text-sidebar-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              My Team
            </button>
            <button
              onClick={() => setViewType("organization")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                viewType === "organization" ? "bg-card text-sidebar-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Organization
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setTimeFilter("week")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                timeFilter === "week" ? "bg-card text-sidebar-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter("month")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                timeFilter === "month" ? "bg-card text-sidebar-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter("all")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                timeFilter === "all" ? "bg-card text-sidebar-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Current User Summary */}
      {currentUserEntry && (
        <div className="mb-6 p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg">
                {currentUserEntry.avatar}
              </div>
              <div>
                <div className="text-sm text-sidebar-foreground mb-1">Your Position</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-sidebar-foreground">#{currentUserEntry.rank}</span>
                  <span className="text-sm text-muted-foreground">of {teamLeaderboard.length}</span>
                  {currentUserEntry.change !== 0 && (
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        currentUserEntry.change > 0
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {currentUserEntry.change > 0 ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {Math.abs(currentUserEntry.change)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-8 text-right">
              <div>
                <div className="text-xs text-muted-foreground mb-1">TOTAL POINTS</div>
                <div className="text-2xl text-sidebar-foreground">{currentUserEntry.points.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">PROGRESS</div>
                <div className="text-2xl text-sidebar-foreground">{currentUserEntry.progress}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">GAP TO #1</div>
                <div className="text-2xl text-accent">
                  {(topThree[0].points - currentUserEntry.points).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {topThree.map((entry) => {
          const isCurrentUser = entry.isCurrentUser;
          return (
            <div
              key={entry.rank}
              className={`relative p-6 border rounded-lg ${getRankBadge(entry.rank)} ${
                isCurrentUser ? "ring-2 ring-accent/50" : ""
              }`}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-current shadow-lg">
                {getRankIcon(entry.rank)}
              </div>

              <div className="text-center mt-4">
                {/* Avatar */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-lg mx-auto mb-3 ${
                    entry.rank === 1
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
                      : entry.rank === 2
                      ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                      : "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                  }`}
                >
                  {entry.avatar}
                </div>

                <div className="text-sm text-sidebar-foreground mb-1">{entry.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{entry.role}</div>

                {/* Points */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Award className="w-4 h-4 text-accent" />
                  <span className="text-lg text-sidebar-foreground">{entry.points.toLocaleString()}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${entry.progress}%` }} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{entry.progress}% complete</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of Leaderboard - Table Format */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border text-xs text-muted-foreground">
          <div className="col-span-1">RANK</div>
          <div className="col-span-4">NAME</div>
          <div className="col-span-2 text-right">POINTS</div>
          <div className="col-span-3">PROGRESS</div>
          <div className="col-span-2 text-center">CHANGE</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border">
          {restOfLeaderboard.map((entry) => {
            const isCurrentUser = entry.isCurrentUser;
            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors ${
                  isCurrentUser ? "bg-accent/5" : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-muted-foreground">#{entry.rank}</span>
                </div>

                {/* Name & Role */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-sidebar-foreground">
                    {entry.avatar}
                  </div>
                  <div>
                    <div className="text-sm text-sidebar-foreground">
                      {entry.name}
                      {isCurrentUser && <span className="ml-2 text-xs text-accent">(You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.role}</div>
                  </div>
                </div>

                {/* Points */}
                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-accent" />
                    <span className="text-sm text-sidebar-foreground">{entry.points.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${entry.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{entry.progress}%</span>
                </div>

                {/* Change */}
                <div className="col-span-2 flex items-center justify-center">
                  {entry.change !== 0 ? (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        entry.change > 0
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {entry.change > 0 ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {Math.abs(entry.change)}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Insights */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TEAM AVERAGE</span>
          </div>
          <div className="text-2xl text-sidebar-foreground">10,306</div>
          <div className="text-xs text-green-600 mt-1">+12% from last month</div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TOP PERFORMER</span>
          </div>
          <div className="text-2xl text-sidebar-foreground">Sarah Chen</div>
          <div className="text-xs text-muted-foreground mt-1">12,450 points</div>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TEAM GOAL</span>
          </div>
          <div className="text-2xl text-sidebar-foreground">85%</div>
          <div className="text-xs text-muted-foreground mt-1">Program completion</div>
        </div>
      </div>
    </div>
  );
}
