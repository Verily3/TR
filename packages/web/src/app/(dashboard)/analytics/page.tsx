'use client';

import { useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  ClipboardList,
  Target,
  Users,
  Download,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTenants } from '@/hooks/api/useTenants';
import { useAnalytics, type AnalyticsData } from '@/hooks/api/useAnalytics';

// ============================================
// Types
// ============================================
type TimeRange = '7d' | '30d' | '90d' | '12m';
type Tab = 'overview' | 'programs' | 'assessments' | 'team' | 'goals';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface TabProps {
  data?: AnalyticsData;
  isLoading?: boolean;
}

// ============================================
// Constants
// ============================================
const timeRangeOptions: { id: TimeRange; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
];

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'programs', label: 'Programs' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'team', label: 'Team' },
  { id: 'goals', label: 'Goals' },
];

// ============================================
// Shared UI Components
// ============================================

function HeaderDropdown<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        {selected?.label}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                opt.id === value
                  ? 'text-accent font-medium bg-accent/5'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.id === value ? 'bg-accent' : ''}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatSkeleton() {
  return <div className="h-7 w-14 bg-gray-200 rounded animate-pulse" />;
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === 'up') return (
    <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
      <TrendingUp className="w-3 h-3" /> Up
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
      <TrendingDown className="w-3 h-3" /> Down
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs font-medium">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

function BarChart({ data, height = 120 }: { data: ChartDataPoint[]; height?: number }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>No data</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const barArea = height - 20;
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((point, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full bg-accent/70 rounded-t transition-all"
            style={{ height: `${Math.max((point.value / max) * barArea, point.value > 0 ? 2 : 0)}px` }}
            title={`${point.label}: ${point.value}`}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">
            {point.label.length === 7 ? point.label.slice(5) : point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HorizBar({
  label,
  value,
  max,
  color = 'bg-accent',
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading,
}: {
  label: string;
  value: string | number | undefined;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`${iconBg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-xl font-bold text-gray-900">
        {isLoading ? <StatSkeleton /> : (value ?? 0)}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================
function OverviewTab({ data, isLoading }: TabProps) {
  const cards = [
    {
      title: 'Total Programs',
      icon: BookOpen,
      value: data?.overview.programs.total,
      sub: `${data?.overview.programs.change ?? 0} active`,
      trend: data?.overview.programs.trend ?? 'stable',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Assessments',
      icon: ClipboardList,
      value: data?.overview.assessments.total,
      sub: `${data?.overview.assessments.active ?? 0} open`,
      trend: data?.overview.assessments.trend ?? 'stable',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Enrollments',
      icon: Users,
      value: data?.overview.enrollments.total,
      sub: `+${data?.overview.enrollments.newInPeriod ?? 0} this period`,
      trend: data?.overview.enrollments.trend ?? 'stable',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Goal Completion',
      icon: Target,
      value: data?.overview.goals.total,
      sub: `${data?.overview.goals.completionRate ?? 0}% complete`,
      trend: data?.overview.goals.trend ?? 'stable',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`${card.bg} p-2 rounded-lg`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <TrendBadge trend={card.trend} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-0.5">
            {isLoading ? <StatSkeleton /> : (card.value ?? 0)}
          </div>
          <div className="text-sm font-medium text-gray-700">{card.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Programs Tab
// ============================================
function ProgramsTab({ data, isLoading }: TabProps) {
  const p = data?.programs;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Programs" value={p?.totalPrograms} icon={BookOpen} iconColor="text-blue-500" iconBg="bg-blue-50" isLoading={isLoading} />
        <StatCard label="Active" value={p?.activePrograms} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" isLoading={isLoading} />
        <StatCard label="Avg Progress" value={p ? `${p.averageProgress}%` : undefined} icon={TrendingUp} iconColor="text-purple-500" iconBg="bg-purple-50" isLoading={isLoading} />
        <StatCard label="Completion Rate" value={p ? `${p.completionRate}%` : undefined} icon={Award} iconColor="text-amber-500" iconBg="bg-amber-50" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
          {isLoading
            ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
            : <BarChart data={p?.enrollmentTrend ?? []} height={128} />
          }
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Completion Trend</h3>
          {isLoading
            ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
            : <BarChart data={p?.completionTrend ?? []} height={128} />
          }
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Programs by Enrollment</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : !p?.topPrograms?.length ? (
          <p className="text-sm text-gray-400 text-center py-6">No program data</p>
        ) : (
          <div className="space-y-3">
            {p.topPrograms.map((prog) => (
              <div key={prog.id} className="flex items-center gap-4 py-1">
                <span className="text-sm text-gray-700 flex-1 truncate">{prog.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{prog.enrollments} enrolled</span>
                <span className="text-xs font-medium text-gray-700 w-16 text-right flex-shrink-0">{prog.completionRate}% done</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {p?.programsByStatus && p.programsByStatus.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Programs by Status</h3>
          <div className="space-y-2.5">
            {p.programsByStatus.map((s) => (
              <HorizBar key={s.label} label={s.label} value={s.value} max={p.totalPrograms || 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Assessments Tab
// ============================================
function AssessmentsTab({ data, isLoading }: TabProps) {
  const a = data?.assessments;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={a?.totalAssessments} icon={ClipboardList} iconColor="text-blue-500" iconBg="bg-blue-50" isLoading={isLoading} />
        <StatCard label="Active / Open" value={a?.activeAssessments} icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-50" isLoading={isLoading} />
        <StatCard label="Completed" value={a?.completedAssessments} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" isLoading={isLoading} />
        <StatCard label="Avg Response Rate" value={a ? `${a.averageResponseRate}%` : undefined} icon={TrendingUp} iconColor="text-purple-500" iconBg="bg-purple-50" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Assessment Activity Trend</h3>
          {isLoading
            ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
            : <BarChart data={a?.responseRateTrend ?? []} height={128} />
          }
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Assessments by Status</h3>
          {isLoading ? (
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
          ) : !a?.assessmentsByStatus?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No assessment data</p>
          ) : (
            <div className="space-y-2.5 mt-4">
              {a.assessmentsByStatus.map((s) => (
                <HorizBar key={s.label} label={s.label} value={s.value} max={a.totalAssessments || 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Team Tab
// ============================================
function TeamTab({ data, isLoading }: TabProps) {
  const t = data?.team;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total Employees" value={t?.totalEmployees} icon={Users} iconColor="text-blue-500" iconBg="bg-blue-50" isLoading={isLoading} />
        <StatCard label="Active" value={t?.activeEmployees} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" isLoading={isLoading} />
        <StatCard label="New Hires (Period)" value={t?.newHires} icon={UserPlus} iconColor="text-purple-500" iconBg="bg-purple-50" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Headcount Growth</h3>
          {isLoading
            ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
            : <BarChart data={t?.headcountTrend ?? []} height={128} />
          }
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Department Breakdown</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : !t?.departmentBreakdown?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No department data</p>
          ) : (
            <div className="space-y-2.5">
              {t.departmentBreakdown.map((d) => (
                <HorizBar key={d.label} label={d.label} value={d.value} max={t.totalEmployees || 1} color="bg-blue-400" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Goals Tab
// ============================================
function GoalsTab({ data, isLoading }: TabProps) {
  const g = data?.goals;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Goals" value={g?.totalGoals} icon={Target} iconColor="text-blue-500" iconBg="bg-blue-50" isLoading={isLoading} />
        <StatCard label="Completed" value={g?.completedGoals} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" isLoading={isLoading} />
        <StatCard label="In Progress" value={g?.inProgressGoals} icon={Clock} iconColor="text-amber-500" iconBg="bg-amber-50" isLoading={isLoading} />
        <StatCard label="Overdue" value={g?.overdueGoals} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Goals Created Trend</h3>
          <p className="text-xs text-gray-400 mb-4">
            Completion rate: <span className="font-medium text-gray-700">{g?.completionRate ?? 0}%</span>
            {' · '}
            Avg progress: <span className="font-medium text-gray-700">{g?.averageProgress ?? 0}%</span>
          </p>
          {isLoading
            ? <div className="h-32 bg-gray-100 rounded animate-pulse" />
            : <BarChart data={g?.goalsTrend ?? []} height={128} />
          }
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Goals by Status</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : !g?.goalsByStatus?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">No goal data</p>
            ) : (
              <div className="space-y-2.5">
                {g.goalsByStatus.map((s) => (
                  <HorizBar key={s.label} label={s.label} value={s.value} max={g.totalGoals || 1} color="bg-emerald-400" />
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Goals by Category</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : !g?.goalsByCategory?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">No category data</p>
            ) : (
              <div className="space-y-2.5">
                {g.goalsByCategory.map((c) => (
                  <HorizBar key={c.label} label={c.label} value={c.value} max={g.totalGoals || 1} color="bg-amber-400" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');

  const isAgencyUser = !!user?.agencyId;
  const { data: tenants = [] } = useTenants();

  const clientOptions: { id: string; label: string }[] = [
    { id: 'all', label: 'All Clients' },
    ...tenants.map((t) => ({ id: t.id, label: t.name })),
  ];

  const { data, isLoading } = useAnalytics(
    timeRange,
    selectedTenantId === 'all' ? undefined : selectedTenantId
  );

  const tabProps: TabProps = { data, isLoading };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track program performance, engagement, and outcomes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAgencyUser && (
            <HeaderDropdown
              options={clientOptions}
              value={selectedTenantId}
              onChange={setSelectedTenantId}
            />
          )}
          <HeaderDropdown
            options={timeRangeOptions}
            value={timeRange}
            onChange={setTimeRange}
          />
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'     && <OverviewTab     {...tabProps} />}
      {activeTab === 'programs'     && <ProgramsTab     {...tabProps} />}
      {activeTab === 'assessments'  && <AssessmentsTab  {...tabProps} />}
      {activeTab === 'team'         && <TeamTab         {...tabProps} />}
      {activeTab === 'goals'        && <GoalsTab        {...tabProps} />}
    </div>
  );
}
