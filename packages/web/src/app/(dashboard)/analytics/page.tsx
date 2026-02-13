'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  ClipboardList,
  Target,
  Users,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  UserPlus,
  Building2,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// ============================================
// Types
// ============================================
type TimeRange = '7d' | '30d' | '90d' | '12m';
type MetricTrend = 'up' | 'down' | 'stable';
type Tab = 'overview' | 'programs' | 'assessments' | 'team' | 'goals';

interface ChartDataPoint {
  label: string;
  value: number;
}

// ============================================
// Mock Data
// ============================================
const timeRangeOptions = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
];

const overviewMetrics = {
  programs: { total: 12, change: 20, trend: 'up' as MetricTrend },
  assessments: { total: 48, change: 15, trend: 'up' as MetricTrend },
  goals: { completionRate: 78, change: 5, trend: 'up' as MetricTrend },
  engagement: { score: 4.2, change: -2, trend: 'down' as MetricTrend },
};

const programMetrics = {
  totalPrograms: 12,
  activePrograms: 8,
  completedPrograms: 4,
  totalEnrollments: 342,
  activeEnrollments: 256,
  completionRate: 73,
  averageProgress: 62,
  averageTimeToComplete: 45,
  enrollmentTrend: [
    { date: '2024-07', value: 28 },
    { date: '2024-08', value: 35 },
    { date: '2024-09', value: 42 },
    { date: '2024-10', value: 38 },
    { date: '2024-11', value: 52 },
    { date: '2024-12', value: 45 },
    { date: '2025-01', value: 58 },
  ],
  completionTrend: [
    { date: '2024-07', value: 12 },
    { date: '2024-08', value: 18 },
    { date: '2024-09', value: 15 },
    { date: '2024-10', value: 22 },
    { date: '2024-11', value: 28 },
    { date: '2024-12', value: 24 },
    { date: '2025-01', value: 32 },
  ],
  programsByStatus: [
    { label: 'Active', value: 8 },
    { label: 'Completed', value: 4 },
    { label: 'Draft', value: 2 },
    { label: 'Archived', value: 1 },
  ],
  topPrograms: [
    { id: 'p1', name: 'Leadership Excellence', enrollments: 86, completionRate: 82 },
    { id: 'p2', name: 'Manager to Leader', enrollments: 64, completionRate: 75 },
    { id: 'p3', name: 'New Manager Bootcamp', enrollments: 52, completionRate: 88 },
    { id: 'p4', name: 'Executive Presence', enrollments: 45, completionRate: 68 },
    { id: 'p5', name: 'Strategic Thinking', enrollments: 38, completionRate: 71 },
  ],
};

const assessmentMetrics = {
  totalAssessments: 48,
  activeAssessments: 12,
  completedAssessments: 36,
  totalResponses: 892,
  averageResponseRate: 84,
  averageScore: 3.8,
  responseRateTrend: [
    { date: '2024-07', value: 78 },
    { date: '2024-08', value: 82 },
    { date: '2024-09', value: 79 },
    { date: '2024-10', value: 85 },
    { date: '2024-11', value: 88 },
    { date: '2024-12', value: 84 },
    { date: '2025-01', value: 86 },
  ],
  scoresByCompetency: [
    { label: 'Communication', value: 4.2 },
    { label: 'Leadership', value: 3.9 },
    { label: 'Strategic Thinking', value: 3.6 },
    { label: 'Team Development', value: 3.8 },
    { label: 'Decision Making', value: 3.7 },
    { label: 'Innovation', value: 3.5 },
  ],
  assessmentsByStatus: [
    { label: 'Completed', value: 36 },
    { label: 'Active', value: 12 },
    { label: 'Draft', value: 4 },
  ],
  topStrengths: ['Communication', 'Collaboration', 'Problem Solving'],
  topDevelopmentAreas: ['Strategic Thinking', 'Innovation', 'Delegation'],
};

const teamMetrics = {
  totalEmployees: 156,
  activeEmployees: 148,
  newHires: 12,
  turnoverRate: 8.5,
  averageTenure: 28,
  departmentBreakdown: [
    { label: 'Engineering', value: 48 },
    { label: 'Sales', value: 32 },
    { label: 'Marketing', value: 24 },
    { label: 'Operations', value: 20 },
    { label: 'HR', value: 16 },
    { label: 'Finance', value: 16 },
  ],
  headcountTrend: [
    { date: '2024-07', value: 142 },
    { date: '2024-08', value: 145 },
    { date: '2024-09', value: 148 },
    { date: '2024-10', value: 150 },
    { date: '2024-11', value: 152 },
    { date: '2024-12', value: 154 },
    { date: '2025-01', value: 156 },
  ],
  engagementScore: 4.2,
  goalCompletionRate: 78,
  trainingHoursPerEmployee: 24,
};

const goalMetrics = {
  totalGoals: 234,
  completedGoals: 156,
  inProgressGoals: 62,
  overdueGoals: 16,
  completionRate: 67,
  averageProgress: 72,
  goalsByStatus: [
    { label: 'Completed', value: 156 },
    { label: 'In Progress', value: 62 },
    { label: 'Not Started', value: 24 },
    { label: 'Overdue', value: 16 },
  ],
  goalsTrend: [
    { date: '2024-07', value: 18 },
    { date: '2024-08', value: 22 },
    { date: '2024-09', value: 25 },
    { date: '2024-10', value: 28 },
    { date: '2024-11', value: 32 },
    { date: '2024-12', value: 24 },
    { date: '2025-01', value: 28 },
  ],
  goalsByCategory: [
    { label: 'Professional Development', value: 68 },
    { label: 'Performance', value: 52 },
    { label: 'Leadership', value: 45 },
    { label: 'Technical Skills', value: 38 },
    { label: 'Team Building', value: 31 },
  ],
};

// ============================================
// Tab configuration
// ============================================
const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'programs', label: 'Programs', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'assessments', label: 'Assessments', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
];

// ============================================
// Inline Chart Components
// ============================================
function SimpleBarChart({
  data,
  color = 'accent',
}: {
  data: { label: string; value: number }[];
  color?: 'accent' | 'blue' | 'green' | 'purple';
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const colorClass = {
    accent: 'bg-red-600',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }[color];

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex flex-col items-center justify-end h-32">
            <div className="text-xs text-gray-500 mb-1">{item.value}</div>
            <div
              className={`w-full max-w-[40px] ${colorClass} rounded-t transition-all`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleLineChart({
  data,
  color = 'accent',
  suffix = '',
}: {
  data: { label: string; value: number }[];
  color?: 'accent' | 'blue' | 'green' | 'purple';
  suffix?: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const strokeColor = {
    accent: '#E53E3E',
    blue: '#3B82F6',
    green: '#22C55E',
    purple: '#A855F7',
  }[color];

  const points = data
    .map((item, i) => {
      const x = (i / (data.length - 1)) * 280 + 10;
      const y = 120 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative h-40">
      <svg viewBox="0 0 300 140" className="w-full h-32">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="10"
            y1={20 + i * 25}
            x2="290"
            y2={20 + i * 25}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-200"
          />
        ))}
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((item, i) => {
          const x = (i / (data.length - 1)) * 280 + 10;
          const y = 120 - ((item.value - minValue) / range) * 100;
          return <circle key={i} cx={x} cy={y} r="4" fill={strokeColor} className="cursor-pointer" />;
        })}
      </svg>
      {/* Labels */}
      <div className="flex justify-between px-2 text-xs text-gray-500">
        {data.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: ChartDataPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#22C55E', '#3B82F6', '#EAB308', '#9CA3AF'];
  let currentAngle = -90;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {data.map((item, i) => {
        const percentage = item.value / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={colors[i]}
          />
        );
      })}
      <circle cx="50" cy="50" r="25" fill="white" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-900">
        {total}
      </text>
    </svg>
  );
}

// ============================================
// Helper Functions
// ============================================
function getTrendIcon(trend: MetricTrend) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    default:
      return <Minus className="w-4 h-4 text-gray-500" />;
  }
}

function getTrendColor(trend: MetricTrend, positive = true) {
  if (trend === 'stable') return 'text-gray-500';
  if (positive) {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  }
  return trend === 'up' ? 'text-red-600' : 'text-green-600';
}

// ============================================
// Main Page Component
// ============================================
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500">
              Track performance metrics and gain insights across your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'programs' && <ProgramsTab />}
      {activeTab === 'assessments' && <AssessmentsTab />}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'goals' && <GoalsTab />}
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================
function OverviewTab() {
  const overview = overviewMetrics;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            {getTrendIcon(overview.programs.trend)}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{overview.programs.total}</div>
          <div className="text-sm text-gray-500 mb-2">Active Programs</div>
          <div className={`text-sm ${getTrendColor(overview.programs.trend)}`}>
            {overview.programs.change > 0 ? '+' : ''}
            {overview.programs.change}% from last period
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            {getTrendIcon(overview.assessments.trend)}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{overview.assessments.total}</div>
          <div className="text-sm text-gray-500 mb-2">Assessments Completed</div>
          <div className={`text-sm ${getTrendColor(overview.assessments.trend)}`}>
            {overview.assessments.change > 0 ? '+' : ''}
            {overview.assessments.change}% from last period
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <Target className="w-6 h-6 text-green-600" />
            {getTrendIcon(overview.goals.trend)}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{overview.goals.completionRate}%</div>
          <div className="text-sm text-gray-500 mb-2">Goal Completion Rate</div>
          <div className={`text-sm ${getTrendColor(overview.goals.trend)}`}>
            {overview.goals.change > 0 ? '+' : ''}
            {overview.goals.change}% from last period
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            {getTrendIcon(overview.engagement.trend)}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{overview.engagement.score}</div>
          <div className="text-sm text-gray-500 mb-2">Engagement Score</div>
          <div className={`text-sm ${getTrendColor(overview.engagement.trend)}`}>
            {overview.engagement.change > 0 ? '+' : ''}
            {overview.engagement.change}% from last period
          </div>
        </div>
      </div>

      {/* Quick Insights Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Program Enrollment Trend</h3>
          <SimpleBarChart
            data={[
              { label: 'Jul', value: 28 },
              { label: 'Aug', value: 35 },
              { label: 'Sep', value: 42 },
              { label: 'Oct', value: 38 },
              { label: 'Nov', value: 52 },
              { label: 'Dec', value: 45 },
              { label: 'Jan', value: 58 },
            ]}
            color="accent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Response Rate</h3>
          <SimpleLineChart
            data={[
              { label: 'Jul', value: 78 },
              { label: 'Aug', value: 82 },
              { label: 'Sep', value: 79 },
              { label: 'Oct', value: 85 },
              { label: 'Nov', value: 88 },
              { label: 'Dec', value: 84 },
              { label: 'Jan', value: 86 },
            ]}
            color="blue"
            suffix="%"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Programs</h3>
          <div className="space-y-3">
            {[
              { name: 'Leadership Excellence', value: 86 },
              { name: 'Manager to Leader', value: 64 },
              { name: 'New Manager Bootcamp', value: 52 },
            ].map((program, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{program.name}</span>
                <span className="text-sm font-medium text-red-600">{program.value} enrollments</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Competencies</h3>
          <div className="space-y-3">
            {[
              { name: 'Communication', value: 4.2 },
              { name: 'Leadership', value: 3.9 },
              { name: 'Team Development', value: 3.8 },
            ].map((comp, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{comp.name}</span>
                <span className="text-sm font-medium text-blue-600">{comp.value}/5.0</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Development Areas</h3>
          <div className="space-y-3">
            {['Strategic Thinking', 'Innovation', 'Delegation'].map((area, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-900">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                {area}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Programs Tab
// ============================================
function ProgramsTab() {
  const metrics = programMetrics;
  const maxEnrollment = Math.max(...metrics.enrollmentTrend.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalPrograms}</div>
          <div className="text-sm text-gray-500">Total Programs</div>
          <div className="text-xs text-green-600 mt-1">{metrics.activePrograms} active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalEnrollments}</div>
          <div className="text-sm text-gray-500">Total Enrollments</div>
          <div className="text-xs text-blue-600 mt-1">{metrics.activeEnrollments} currently active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.completionRate}%</div>
          <div className="text-sm text-gray-500">Completion Rate</div>
          <div className="text-xs text-gray-500 mt-1">Avg progress: {metrics.averageProgress}%</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.averageTimeToComplete}</div>
          <div className="text-sm text-gray-500">Avg Days to Complete</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Trend</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {metrics.enrollmentTrend.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div className="text-xs text-gray-500 mb-1">{item.value}</div>
                  <div
                    className="w-full max-w-[40px] bg-red-600 rounded-t transition-all"
                    style={{ height: `${(item.value / maxEnrollment) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{item.date.split('-')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Programs by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Programs by Status</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <DonutChart data={metrics.programsByStatus} />
            </div>
            <div className="ml-8 space-y-2">
              {metrics.programsByStatus.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-gray-400'][i]
                    }`}
                  />
                  <span className="text-sm text-gray-500">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Programs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Programs</h3>
          <Award className="w-5 h-5 text-red-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Program Name</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Enrollments</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Completion Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPrograms.map((program, i) => (
                <tr key={program.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </div>
                      <span className="text-gray-900">{program.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{program.enrollments}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-medium ${
                        program.completionRate >= 80
                          ? 'text-green-600'
                          : program.completionRate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {program.completionRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            program.completionRate >= 80
                              ? 'bg-green-500'
                              : program.completionRate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${program.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completion Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Completions Over Time</h3>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div className="h-48 relative">
          <svg viewBox="0 0 700 180" className="w-full h-full">
            {/* Grid */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="40"
                y1={30 + i * 40}
                x2="680"
                y2={30 + i * 40}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200"
              />
            ))}
            {/* Area */}
            <path
              d={`M40,150 ${metrics.completionTrend
                .map((item, i) => {
                  const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
                  const y = 150 - (item.value / 40) * 120;
                  return `L${x},${y}`;
                })
                .join(' ')} L680,150 Z`}
              fill="rgba(34, 197, 94, 0.1)"
            />
            {/* Line */}
            <polyline
              points={metrics.completionTrend
                .map((item, i) => {
                  const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
                  const y = 150 - (item.value / 40) * 120;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
            />
            {/* Points */}
            {metrics.completionTrend.map((item, i) => {
              const x = 40 + (i * 640) / (metrics.completionTrend.length - 1);
              const y = 150 - (item.value / 40) * 120;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#22C55E" />
                  <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-gray-500">
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between px-10 text-xs text-gray-500">
            {metrics.completionTrend.map((item, i) => (
              <span key={i}>{item.date.split('-')[1]}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Assessments Tab
// ============================================
function AssessmentsTab() {
  const metrics = assessmentMetrics;
  const maxScore = 5;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalAssessments}</div>
          <div className="text-sm text-gray-500">Total Assessments</div>
          <div className="text-xs text-blue-600 mt-1">{metrics.activeAssessments} active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalResponses}</div>
          <div className="text-sm text-gray-500">Total Responses</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.averageResponseRate}%</div>
          <div className="text-sm text-gray-500">Avg Response Rate</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.averageScore.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Average Score</div>
          <div className="text-xs text-gray-500 mt-1">out of 5.0</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores by Competency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Scores by Competency</h3>
          <div className="space-y-4">
            {metrics.scoresByCompetency.map((comp, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900">{comp.label}</span>
                  <span
                    className={`text-sm font-medium ${
                      comp.value >= 4 ? 'text-green-600' : comp.value >= 3.5 ? 'text-blue-600' : 'text-yellow-600'
                    }`}
                  >
                    {comp.value.toFixed(1)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      comp.value >= 4 ? 'bg-green-500' : comp.value >= 3.5 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${(comp.value / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Rate Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response Rate Trend</h3>
          <div className="h-48 relative">
            <svg viewBox="0 0 300 160" className="w-full h-40">
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line
                    x1="30"
                    y1={20 + i * 30}
                    x2="290"
                    y2={20 + i * 30}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-200"
                  />
                  <text x="25" y={24 + i * 30} textAnchor="end" className="text-xs fill-gray-500">
                    {100 - i * 10}%
                  </text>
                </g>
              ))}
              {/* Area */}
              <path
                d={`M30,140 ${metrics.responseRateTrend
                  .map((item, i) => {
                    const x = 30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                    const y = 140 - ((item.value - 60) / 40) * 120;
                    return `L${x},${y}`;
                  })
                  .join(' ')} L290,140 Z`}
                fill="rgba(59, 130, 246, 0.1)"
              />
              {/* Line */}
              <polyline
                points={metrics.responseRateTrend
                  .map((item, i) => {
                    const x = 30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                    const y = 140 - ((item.value - 60) / 40) * 120;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              {/* Points */}
              {metrics.responseRateTrend.map((item, i) => {
                const x = 30 + (i * 260) / (metrics.responseRateTrend.length - 1);
                const y = 140 - ((item.value - 60) / 40) * 120;
                return <circle key={i} cx={x} cy={y} r="4" fill="#3B82F6" />;
              })}
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between px-8 text-xs text-gray-500">
              {metrics.responseRateTrend.map((item, i) => (
                <span key={i}>{item.date.split('-')[1]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Organizational Strengths</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            These competencies consistently score highest across assessments
          </p>
          <div className="space-y-3">
            {metrics.topStrengths.map((strength, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium">
                  {i + 1}
                </div>
                <span className="text-gray-900 font-medium">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Development Areas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-medium text-gray-900">Development Focus Areas</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            These areas show opportunity for growth and development
          </p>
          <div className="space-y-3">
            {metrics.topDevelopmentAreas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-medium">
                  {i + 1}
                </div>
                <span className="text-gray-900 font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Status Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Status Distribution</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
              {metrics.assessmentsByStatus.map((status, i) => {
                const total = metrics.assessmentsByStatus.reduce((sum, s) => sum + s.value, 0);
                const percentage = (status.value / total) * 100;
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
                return (
                  <div key={i} className={`h-full ${colors[i]} transition-all`} style={{ width: `${percentage}%` }} />
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            {metrics.assessmentsByStatus.map((status, i) => {
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <span className="text-sm text-gray-500">
                    {status.label}: {status.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Team Tab
// ============================================
function TeamTab() {
  const metrics = teamMetrics;
  const maxDeptValue = Math.max(...metrics.departmentBreakdown.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalEmployees}</div>
          <div className="text-sm text-gray-500">Total Employees</div>
          <div className="text-xs text-green-600 mt-1">{metrics.activeEmployees} active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">+{metrics.newHires}</div>
          <div className="text-sm text-gray-500">New Hires</div>
          <div className="text-xs text-gray-500 mt-1">this month</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.turnoverRate}%</div>
          <div className="text-sm text-gray-500">Turnover Rate</div>
          <div className="text-xs text-gray-500 mt-1">annualized</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.averageTenure}</div>
          <div className="text-sm text-gray-500">Avg Tenure (months)</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">Headcount by Department</h3>
          </div>
          <div className="space-y-4">
            {metrics.departmentBreakdown.map((dept, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900">{dept.label}</span>
                  <span className="text-sm font-medium text-gray-900">{dept.value}</span>
                </div>
                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: `${(dept.value / maxDeptValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Headcount Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Headcount Trend</h3>
          <div className="h-48 relative">
            <svg viewBox="0 0 300 160" className="w-full h-40">
              {/* Grid */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="30"
                  y1={20 + i * 30}
                  x2="290"
                  y2={20 + i * 30}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200"
                />
              ))}
              {/* Area */}
              <path
                d={`M30,140 ${metrics.headcountTrend
                  .map((item, i) => {
                    const x = 30 + (i * 260) / (metrics.headcountTrend.length - 1);
                    const minVal = 140;
                    const maxVal = 160;
                    const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                    return `L${x},${y}`;
                  })
                  .join(' ')} L290,140 Z`}
                fill="rgba(229, 62, 62, 0.1)"
              />
              {/* Line */}
              <polyline
                points={metrics.headcountTrend
                  .map((item, i) => {
                    const x = 30 + (i * 260) / (metrics.headcountTrend.length - 1);
                    const minVal = 140;
                    const maxVal = 160;
                    const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#E53E3E"
                strokeWidth="2"
              />
              {/* Points */}
              {metrics.headcountTrend.map((item, i) => {
                const x = 30 + (i * 260) / (metrics.headcountTrend.length - 1);
                const minVal = 140;
                const maxVal = 160;
                const y = 140 - ((item.value - minVal) / (maxVal - minVal)) * 120;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#E53E3E" />
                    <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-gray-500">
                      {item.value}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* X-axis labels */}
            <div className="flex justify-between px-8 text-xs text-gray-500">
              {metrics.headcountTrend.map((item, i) => (
                <span key={i}>{item.date.split('-')[1]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">Engagement Score</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.engagementScore / 5) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.engagementScore}</span>
                <span className="text-xs text-gray-500">out of 5</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">Based on latest employee survey</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Goal Completion</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.goalCompletionRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.goalCompletionRate}%</span>
                <span className="text-xs text-gray-500">completed</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">Company-wide goal achievement</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Training Hours</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.trainingHoursPerEmployee / 40) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{metrics.trainingHoursPerEmployee}</span>
                <span className="text-xs text-gray-500">hrs/person</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">Average training hours per employee</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Team Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{Math.round(metrics.totalEmployees * 0.48)}</div>
            <div className="text-sm text-gray-500">Remote Workers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{Math.round(metrics.totalEmployees * 0.35)}</div>
            <div className="text-sm text-gray-500">In Management</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">6</div>
            <div className="text-sm text-gray-500">Departments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">12</div>
            <div className="text-sm text-gray-500">Teams</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Goals Tab
// ============================================
function GoalsTab() {
  const metrics = goalMetrics;
  const maxCategoryValue = Math.max(...metrics.goalsByCategory.map((d) => d.value));

  const statusColors: Record<string, string> = {
    Completed: 'bg-green-500',
    'In Progress': 'bg-blue-500',
    'Not Started': 'bg-gray-400',
    Overdue: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.totalGoals}</div>
          <div className="text-sm text-gray-500">Total Goals</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.completedGoals}</div>
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-xs text-green-600 mt-1">{metrics.completionRate}% completion rate</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.inProgressGoals}</div>
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-xs text-gray-500 mt-1">{metrics.averageProgress}% avg progress</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.overdueGoals}</div>
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-xs text-red-600 mt-1">requires attention</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Goals by Status</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {(() => {
                  const total = metrics.goalsByStatus.reduce((sum, d) => sum + d.value, 0);
                  let currentAngle = -90;
                  const colors = ['#22C55E', '#3B82F6', '#9CA3AF', '#EF4444'];

                  return metrics.goalsByStatus.map((item, i) => {
                    const percentage = item.value / total;
                    const angle = percentage * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                      <path
                        key={i}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={colors[i]}
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="25" fill="white" />
                <text x="50" y="46" textAnchor="middle" className="text-lg font-bold fill-gray-900">
                  {metrics.completionRate}%
                </text>
                <text x="50" y="58" textAnchor="middle" className="text-xs fill-gray-500">
                  complete
                </text>
              </svg>
            </div>
            <div className="space-y-3">
              {metrics.goalsByStatus.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[item.label]}`} />
                  <span className="text-sm text-gray-900 min-w-[100px]">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">Goals by Category</h3>
          </div>
          <div className="space-y-4">
            {metrics.goalsByCategory.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900">{cat.label}</span>
                  <span className="text-sm font-medium text-gray-900">{cat.value}</span>
                </div>
                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: `${(cat.value / maxCategoryValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Completion Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Goal Completions Over Time</h3>
        </div>
        <div className="h-48 relative">
          <svg viewBox="0 0 700 180" className="w-full h-full">
            {/* Grid */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="40"
                y1={30 + i * 40}
                x2="680"
                y2={30 + i * 40}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200"
              />
            ))}
            {/* Bars */}
            {metrics.goalsTrend.map((item, i) => {
              const barWidth = 60;
              const gap = (640 - barWidth * metrics.goalsTrend.length) / (metrics.goalsTrend.length - 1);
              const x = 40 + i * (barWidth + gap);
              const maxVal = 40;
              const height = (item.value / maxVal) * 120;
              const y = 150 - height;

              return (
                <g key={i}>
                  <rect x={x} y={y} width={barWidth} height={height} fill="#22C55E" rx="4" />
                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-xs fill-gray-500">
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between px-10 text-xs text-gray-500">
            {metrics.goalsTrend.map((item, i) => (
              <span key={i}>{item.date.split('-')[1]}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Distribution (In-Progress Goals)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { range: '0-20%', count: 8, color: 'bg-red-500' },
            { range: '21-40%', count: 12, color: 'bg-orange-500' },
            { range: '41-60%', count: 18, color: 'bg-yellow-500' },
            { range: '61-80%', count: 15, color: 'bg-blue-500' },
            { range: '81-99%', count: 9, color: 'bg-green-500' },
          ].map((bucket, i) => (
            <div key={i} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-4 h-4 rounded-full ${bucket.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{bucket.count}</div>
              <div className="text-sm text-gray-500">{bucket.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50/50 rounded-xl shadow-sm border border-yellow-200 p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Goals Needing Attention</h4>
              <p className="text-sm text-gray-500 mb-3">
                {metrics.overdueGoals} goals are past their due date and {Math.round(metrics.inProgressGoals * 0.2)}{' '}
                goals have less than 20% progress.
              </p>
              <button className="text-sm text-yellow-700 font-medium hover:underline">View at-risk goals &rarr;</button>
            </div>
          </div>
        </div>

        <div className="bg-green-50/50 rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Recent Achievements</h4>
              <p className="text-sm text-gray-500 mb-3">
                {metrics.goalsTrend[metrics.goalsTrend.length - 1].value} goals were completed this month, a{' '}
                {Math.round(
                  ((metrics.goalsTrend[metrics.goalsTrend.length - 1].value -
                    metrics.goalsTrend[metrics.goalsTrend.length - 2].value) /
                    metrics.goalsTrend[metrics.goalsTrend.length - 2].value) *
                    100
                )}
                % increase from last month.
              </p>
              <button className="text-sm text-green-700 font-medium hover:underline">Celebrate wins &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
