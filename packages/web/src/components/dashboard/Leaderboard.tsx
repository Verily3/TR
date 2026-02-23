'use client';

import { Trophy, Crown, Medal, Award, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  initials: string;
  role: string;
  points: number;
  progress: number;
  change: number;
  isCurrentUser?: boolean;
}

const defaultParticipants: Participant[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Senior Manager',
    points: 12450,
    progress: 87,
    change: 2,
  },
  {
    id: '2',
    name: 'John Doe',
    initials: 'JD',
    role: 'Executive',
    points: 11800,
    progress: 71,
    change: 1,
    isCurrentUser: true,
  },
  {
    id: '3',
    name: 'Michael Torres',
    initials: 'MT',
    role: 'Director',
    points: 11200,
    progress: 68,
    change: -1,
  },
  {
    id: '4',
    name: 'Emma Williams',
    initials: 'EW',
    role: 'Manager',
    points: 10850,
    progress: 65,
    change: 3,
  },
  {
    id: '5',
    name: 'David Park',
    initials: 'DP',
    role: 'Team Lead',
    points: 10300,
    progress: 62,
    change: 0,
  },
  {
    id: '6',
    name: 'Lisa Johnson',
    initials: 'LJ',
    role: 'Manager',
    points: 9750,
    progress: 58,
    change: -2,
  },
  {
    id: '7',
    name: 'Robert Kim',
    initials: 'RK',
    role: 'Senior Manager',
    points: 9200,
    progress: 55,
    change: 1,
  },
  {
    id: '8',
    name: 'Amanda Foster',
    initials: 'AF',
    role: 'Director',
    points: 8900,
    progress: 53,
    change: 0,
  },
];

type ViewType = 'team' | 'organization';
type TimeFilter = 'week' | 'month' | 'all';

interface LeaderboardProps {
  participants?: Participant[];
  isLoading?: boolean;
}

export function Leaderboard({ participants, isLoading }: LeaderboardProps) {
  const [viewType, setViewType] = useState<ViewType>('team');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const displayParticipants = participants ?? defaultParticipants;
  const sorted = [...displayParticipants].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const currentUser = displayParticipants.find((p) => p.isCurrentUser);
  const currentUserRank = sorted.findIndex((p) => p.isCurrentUser) + 1;
  const teamAverage =
    displayParticipants.length > 0
      ? Math.round(
          displayParticipants.reduce((sum, p) => sum + p.points, 0) / displayParticipants.length
        )
      : 0;
  const topPerformer = sorted[0];
  const gapToFirst = currentUser && sorted[0] ? sorted[0].points - currentUser.points : 0;

  const podiumStyles = [
    {
      bg: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-600',
      gradient: 'from-yellow-500 to-yellow-600',
      icon: Crown,
      iconColor: 'text-yellow-500',
    },
    {
      bg: 'from-gray-400/20 to-gray-500/10',
      border: 'border-gray-400/30',
      text: 'text-gray-500',
      gradient: 'from-gray-400 to-gray-500',
      icon: Medal,
      iconColor: 'text-gray-400',
    },
    {
      bg: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/30',
      text: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      icon: Medal,
      iconColor: 'text-orange-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="mt-6 lg:mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-lg sm:text-xl text-sidebar-foreground">Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (displayParticipants.length === 0) {
    return (
      <div className="mt-6 lg:mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-lg sm:text-xl text-sidebar-foreground">Leaderboard</h2>
        </div>
        <div className="text-center py-10 text-sm text-muted-foreground border border-border rounded-xl">
          No learners enrolled yet.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 lg:mt-8">
      {/* Section Header */}
      <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl text-sidebar-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Leaderboard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your progress against peers and goals
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewType('team')}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs transition-colors ${
                viewType === 'team'
                  ? 'bg-card text-sidebar-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              My Team
            </button>
            <button
              onClick={() => setViewType('organization')}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs transition-colors ${
                viewType === 'organization'
                  ? 'bg-card text-sidebar-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Organization
            </button>
          </div>

          <div className="flex bg-muted rounded-lg p-1">
            {(['week', 'month', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2 sm:px-3 py-1.5 rounded text-xs transition-colors capitalize ${
                  timeFilter === filter
                    ? 'bg-card text-sidebar-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current User Summary */}
      {currentUser && (
        <div className="mb-4 lg:mb-6 p-4 lg:p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-base sm:text-lg shrink-0">
                {currentUser.initials}
              </div>
              <div>
                <div className="text-xs sm:text-sm text-sidebar-foreground mb-1">Your Position</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl text-sidebar-foreground">
                    #{currentUserRank}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    of {displayParticipants.length}
                  </span>
                  {currentUser.change !== 0 && (
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        currentUser.change > 0
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {currentUser.change > 0 ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {Math.abs(currentUser.change)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center sm:text-right">
              <div>
                <div className="text-xs text-muted-foreground mb-1">POINTS</div>
                <div className="text-lg sm:text-2xl text-sidebar-foreground">
                  {currentUser.points.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">PROGRESS</div>
                <div className="text-lg sm:text-2xl text-sidebar-foreground">
                  {currentUser.progress}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">GAP TO #1</div>
                <div className="text-lg sm:text-2xl text-accent">{gapToFirst.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Insights */}
      <div className="mb-4 lg:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TEAM AVERAGE</span>
          </div>
          <div className="text-xl sm:text-2xl text-sidebar-foreground">
            {teamAverage.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">+12% from last month</div>
        </div>

        <div className="p-3 sm:p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TOP PERFORMER</span>
          </div>
          <div className="text-xl sm:text-2xl text-sidebar-foreground truncate">
            {topPerformer?.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {topPerformer?.points.toLocaleString()} points
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">TEAM GOAL</span>
          </div>
          <div className="text-xl sm:text-2xl text-sidebar-foreground">85%</div>
          <div className="text-xs text-muted-foreground mt-1">Program completion</div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="mb-4 lg:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {top3.map((participant, index) => {
          const style = podiumStyles[index];
          const Icon = style.icon;
          return (
            <div
              key={participant.id}
              className={`relative p-4 sm:p-6 border rounded-xl bg-gradient-to-br ${style.bg} ${style.border} ${style.text} ${
                participant.isCurrentUser ? 'ring-2 ring-accent/50' : ''
              }`}
            >
              <div className="absolute -top-3 left-4 sm:left-1/2 sm:-translate-x-1/2 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background border-2 border-current shadow-lg">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.iconColor}`} />
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:text-center mt-2 sm:mt-4">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0 sm:mx-auto sm:mb-3 bg-gradient-to-br ${style.gradient} text-white`}
                >
                  {participant.initials}
                </div>

                <div className="flex-1 sm:flex-none">
                  <div className="text-sm text-sidebar-foreground mb-0.5 sm:mb-1">
                    {participant.name}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2 sm:mb-3">
                    {participant.role}
                  </div>
                  <div className="flex items-center sm:justify-center gap-1 mb-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="text-base sm:text-lg text-sidebar-foreground">
                      {participant.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${participant.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {participant.progress}% complete
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest - Mobile Cards */}
      {rest.length > 0 && (
        <div className="sm:hidden space-y-2">
          {rest.map((participant, index) => (
            <div
              key={participant.id}
              className={`p-3 bg-card border border-border rounded-xl ${
                participant.isCurrentUser ? 'bg-accent/5 border-accent/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6">#{index + 4}</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-sidebar-foreground shrink-0">
                  {participant.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-sidebar-foreground truncate">{participant.name}</div>
                  <div className="text-xs text-muted-foreground">{participant.role}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Award className="w-3 h-3 text-accent" />
                    <span className="text-sm text-sidebar-foreground">
                      {participant.points.toLocaleString()}
                    </span>
                  </div>
                  {participant.change !== 0 && (
                    <div
                      className={`flex items-center gap-1 justify-end text-xs mt-1 ${participant.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {participant.change > 0 ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {Math.abs(participant.change)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest - Desktop Table */}
      {rest.length > 0 && (
        <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 lg:px-6 py-3 bg-muted/30 border-b border-border text-xs text-muted-foreground">
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">NAME</div>
            <div className="col-span-2 text-right">POINTS</div>
            <div className="col-span-3">PROGRESS</div>
            <div className="col-span-2 text-center">CHANGE</div>
          </div>

          <div className="divide-y divide-border">
            {rest.map((participant, index) => (
              <div
                key={participant.id}
                className={`grid grid-cols-12 gap-4 px-4 lg:px-6 py-3 lg:py-4 hover:bg-muted/30 transition-colors ${
                  participant.isCurrentUser ? 'bg-accent/5' : ''
                }`}
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-muted-foreground">#{index + 4}</span>
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-sidebar-foreground shrink-0">
                    {participant.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-sidebar-foreground truncate">
                      {participant.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{participant.role}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-accent" />
                    <span className="text-sm text-sidebar-foreground">
                      {participant.points.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${participant.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{participant.progress}%</span>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  {participant.change !== 0 ? (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${participant.change > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                    >
                      {participant.change > 0 ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {Math.abs(participant.change)}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
