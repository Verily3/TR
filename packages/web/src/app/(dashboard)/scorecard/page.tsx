'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Target,
  Star,
  Users,
  Activity,
  ChevronRight,
  DollarSign,
  Factory,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Award,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTenants } from '@/hooks/api/useTenants';
import { useMyProfile } from '@/hooks/api/useMyProfile';
import { useDirectReports } from '@/hooks/api/useUsers';
import {
  useScorecard,
  useScorecardPeriods,
  useOrgHealth,
  type ScorecardItem as ApiScorecardItem,
  type MetricCategory as ApiMetricCategory,
  type ScorecardCompetency as ApiScorecardCompetency,
  type OrgHealthCategory,
} from '@/hooks/api/useScorecard';

// ============================================================================
// Types
// ============================================================================

type TrendDirection = 'up' | 'down' | 'neutral';
type AccountabilityStatus = 'on-track' | 'at-risk' | 'needs-attention';

interface Accountability {
  id: string;
  title: string;
  description: string;
  score: number;
  status: AccountabilityStatus;
}

interface KPI {
  id: string;
  label: string;
  value: string;
  target: string;
  change: string;
  trend: TrendDirection;
  invertTrend?: boolean;
}

interface KPICategory {
  id: string;
  name: string;
  iconName: string;
  kpis: KPI[];
}

interface Competency {
  id: string;
  name: string;
  description: string;
  selfRating: number;
  mentorRating: number;
}

interface DirectReport {
  id: string;
  name: string;
  role: string;
  scorecardScore: number;
  scorecardTrend: TrendDirection;
  goalsCompleted: number;
  goalsTotal: number;
  programsActive: number;
  rating: 'A' | 'A-' | 'B+' | 'B' | 'B-';
}

interface HealthCategory {
  id: string;
  name: string;
  score: number;
  change: number;
  trend: TrendDirection;
}

// (Static data removed — Org Health now uses real API data)

// ============================================================================
// Data Mapping
// ============================================================================

function getCategoryIconName(name: string): string {
  const lower = name.toLowerCase();
  if (
    lower.includes('financ') ||
    lower.includes('revenue') ||
    lower.includes('profit') ||
    lower.includes('ebitda')
  )
    return 'DollarSign';
  if (
    lower.includes('operat') ||
    lower.includes('manufactur') ||
    lower.includes('product') ||
    lower.includes('plant')
  )
    return 'Factory';
  if (
    lower.includes('market') ||
    lower.includes('growth') ||
    lower.includes('sales') ||
    lower.includes('customer')
  )
    return 'TrendingUp';
  if (
    lower.includes('people') ||
    lower.includes('talent') ||
    lower.includes('team') ||
    lower.includes('culture') ||
    lower.includes('hr')
  )
    return 'Users';
  if (
    lower.includes('complian') ||
    lower.includes('safety') ||
    lower.includes('risk') ||
    lower.includes('legal') ||
    lower.includes('audit')
  )
    return 'Shield';
  if (
    lower.includes('brand') ||
    lower.includes('award') ||
    lower.includes('recognit') ||
    lower.includes('quality')
  )
    return 'Award';
  return 'TrendingUp';
}

function mapApiItem(item: ApiScorecardItem): Accountability {
  const statusMap: Record<string, AccountabilityStatus> = {
    on_track: 'on-track',
    at_risk: 'at-risk',
    needs_attention: 'needs-attention',
  };
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    score: item.score,
    status: statusMap[item.status] ?? 'on-track',
  };
}

function mapApiCategory(cat: ApiMetricCategory): KPICategory {
  return {
    id: cat.category,
    name: cat.category,
    iconName: getCategoryIconName(cat.category),
    kpis: cat.metrics.map((m) => ({
      id: m.id,
      label: m.name,
      value: m.actualValue || '—',
      target: m.targetValue || '—',
      change: m.changeLabel ?? '',
      trend: m.trend,
      invertTrend: m.invertTrend === 1,
    })),
  };
}

function mapApiCompetency(comp: ApiScorecardCompetency): Competency {
  return {
    id: comp.id,
    name: comp.name,
    description: comp.description ?? '',
    selfRating: comp.selfRating,
    mentorRating: comp.managerRating,
  };
}

// ============================================================================
// Icon Map (for KPI categories)
// ============================================================================

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Factory,
  TrendingUp,
  Users,
  Shield,
  Award,
};

// ============================================================================
// Inline Utility Components
// ============================================================================

function CircularProgress({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  variant = 'default',
  label,
  ariaLabel,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'auto';
  label?: React.ReactNode;
  ariaLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  function getAutoColor(v: number, m: number) {
    const pct = (v / m) * 100;
    if (pct >= 85) return 'stroke-green-500';
    if (pct >= 70) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  const colorMap: Record<string, string> = {
    default: 'stroke-red-600',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    danger: 'stroke-red-500',
  };

  const strokeColor = variant === 'auto' ? getAutoColor(value, max) : colorMap[variant];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel || `Progress: ${Math.round(percentage)}%`}
    >
      <svg className="transform -rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={`${strokeColor} transition-[stroke-dashoffset] duration-500 ease-out`}
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ?? <span className="text-lg font-semibold text-gray-900">{Math.round(value)}</span>}
      </div>
    </div>
  );
}

function TrendIndicator({
  direction,
  value,
  variant = 'default',
  iconStyle = 'trending',
  size = 'sm',
}: {
  direction: TrendDirection;
  value?: string;
  variant?: 'default' | 'pill' | 'minimal';
  iconStyle?: 'trending' | 'arrow';
  size?: 'sm' | 'md';
}) {
  const trendIconMap = {
    trending: { up: TrendingUp, down: TrendingDown, neutral: Minus },
    arrow: { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus },
  };

  const colorMap = {
    up: { text: 'text-green-600', bg: 'bg-green-100' },
    down: { text: 'text-red-600', bg: 'bg-red-100' },
    neutral: { text: 'text-gray-500', bg: 'bg-gray-100' },
  };

  const sizeClasses = {
    sm: { icon: 'w-3 h-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
  };

  const Icon = trendIconMap[iconStyle][direction];
  const colors = colorMap[direction];
  const sizes = sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${colors.text}`}>
        <Icon className={sizes.icon} aria-hidden="true" />
        {value && <span className={sizes.text}>{value}</span>}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1 ${sizes.padding} rounded-full ${colors.bg} ${colors.text} ${sizes.text} font-medium`}
      >
        <Icon className={sizes.icon} aria-hidden="true" />
        {value && <span>{value}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${colors.text}`}>
      <Icon className={sizes.icon} aria-hidden="true" />
      {value && <span className={`${sizes.text} font-medium`}>{value}</span>}
    </div>
  );
}

function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  ariaLabel,
  className = '',
}: {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'auto';
  ariaLabel?: string;
  className?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };

  const variantClasses: Record<string, string> = {
    default: 'bg-red-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  function getAutoVariant(v: number, m: number) {
    const pct = (v / m) * 100;
    if (pct >= 80) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  }

  const colorVariant = variant === 'auto' ? getAutoVariant(value, max) : variant;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 ${sizeClasses[size]} bg-gray-100 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full ${variantClasses[colorVariant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'sm',
}: {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  label: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}) {
  const statusConfig: Record<
    string,
    { icon: LucideIcon; bg: string; text: string; border: string }
  > = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    },
    danger: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    info: {
      icon: CheckCircle2,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    neutral: {
      icon: CheckCircle2,
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200',
    },
  };

  const sizeClasses = {
    sm: { container: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3' },
    md: { container: 'px-2.5 py-1 text-sm', icon: 'w-4 h-4' },
  };

  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizes.container}`}
    >
      {showIcon && <Icon className={sizes.icon} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-green-500 to-emerald-600',
    'from-red-500 to-pink-600',
  ];

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % gradients.length;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium flex-shrink-0 shadow-sm bg-gradient-to-br ${gradients[colorIndex]} text-white`}
      role="img"
      aria-label={name}
    >
      {initials}
    </div>
  );
}

// ============================================================================
// Section: Role & Mission
// ============================================================================

function RoleMissionSection({
  role,
  mission,
  score,
}: {
  role: string;
  mission: string;
  score: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
        {/* Left: Role & Mission */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-600" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{role || '—'}</h2>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Mission
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            {mission || 'No mission statement set.'}
          </p>
        </div>

        {/* Right: Score Gauge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 text-center">
            Overall Score
          </div>
          <CircularProgress
            value={score}
            max={100}
            size={120}
            strokeWidth={10}
            variant="auto"
            label={
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-gray-900">{score}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            }
            ariaLabel={`Overall score: ${score} out of 100`}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Section: Key Accountabilities
// ============================================================================

const accountabilityStatusMap: Record<
  AccountabilityStatus,
  { type: 'success' | 'warning' | 'danger'; label: string }
> = {
  'on-track': { type: 'success', label: 'On Track' },
  'at-risk': { type: 'warning', label: 'At Risk' },
  'needs-attention': { type: 'danger', label: 'Needs Attention' },
};

const accountabilityBorderColors: Record<AccountabilityStatus, string> = {
  'on-track': 'border-green-200 hover:border-green-300',
  'at-risk': 'border-yellow-200 hover:border-yellow-300',
  'needs-attention': 'border-red-200 hover:border-red-300',
};

function KeyAccountabilitiesSection({ items }: { items: Accountability[] }) {
  return (
    <section className="mb-8">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900 font-semibold">Key Accountabilities</h2>
        </div>
        <div className="mt-3">
          {/* Status Legend */}
          <div className="flex items-center gap-4 text-xs" role="legend">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              <span className="text-gray-500">On Track</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
              <span className="text-gray-500">At Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" aria-hidden="true" />
              <span className="text-gray-500">Needs Attention</span>
            </div>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No accountability items for this period.</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="list"
          aria-label="Key accountabilities"
        >
          {items.map((item) => {
            const status = accountabilityStatusMap[item.status];
            const progressVariant =
              item.status === 'on-track'
                ? 'success'
                : item.status === 'at-risk'
                  ? 'warning'
                  : 'danger';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border p-5 transition-colors ${accountabilityBorderColors[item.status]}`}
                role="listitem"
                aria-label={`${item.title}: ${item.score} points, ${status.label}`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-semibold text-gray-900 mb-1">{item.score}</div>
                    <StatusBadge
                      status={status.type}
                      label={status.label}
                      showIcon={false}
                      size="sm"
                    />
                  </div>
                </div>
                <ProgressBar
                  value={item.score}
                  max={100}
                  variant={progressVariant}
                  size="md"
                  ariaLabel={`Progress: ${item.score}%`}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Section: KPI Dashboard
// ============================================================================

function KPICardInline({ kpi }: { kpi: KPI }) {
  const isPositive = kpi.invertTrend ? kpi.trend === 'down' : kpi.trend === 'up';
  const progressVariant = isPositive ? 'success' : kpi.trend === 'neutral' ? 'default' : 'danger';

  return (
    <div
      className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      role="article"
      aria-label={`${kpi.label}: ${kpi.value}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {kpi.label}
        </span>
        <TrendIndicator
          direction={kpi.trend}
          value={kpi.change}
          variant="pill"
          iconStyle="arrow"
          size="sm"
        />
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-3">{kpi.value}</div>
      <div className="flex items-center gap-2">
        <ProgressBar
          value={75}
          max={100}
          size="sm"
          variant={progressVariant}
          className="flex-1"
          ariaLabel={`Target progress for ${kpi.label}`}
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">{kpi.target}</span>
      </div>
    </div>
  );
}

function KPICategoryCardInline({ category }: { category: KPICategory }) {
  const Icon = iconMap[category.iconName] || DollarSign;
  const columns = category.kpis.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-50" aria-hidden="true">
          <Icon className="w-5 h-5 text-red-600" />
        </div>
        <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
      </div>
      <div
        className={`grid grid-cols-1 gap-4 ${columns}`}
        role="list"
        aria-label={`${category.name} KPIs`}
      >
        {category.kpis.map((kpi) => (
          <KPICardInline key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

function KPIDashboardSection({ categories }: { categories: KPICategory[] }) {
  return (
    <section className="mb-8">
      <header className="mb-4">
        <h2 className="text-gray-900 font-semibold">Key Performance Indicators</h2>
      </header>
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No KPI metrics for this period.</p>
        </div>
      ) : (
        <div className="space-y-6" role="list" aria-label="KPI categories">
          {categories.map((category) => (
            <KPICategoryCardInline key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Section: A-Player Competencies
// ============================================================================

function RatingBar({
  value,
  max,
  variant,
  label,
}: {
  value: number;
  max: number;
  variant: 'self' | 'mentor';
  label: string;
}) {
  const percentage = (value / max) * 100;
  const bgColor = variant === 'self' ? 'bg-red-600' : 'bg-blue-500';
  const trackColor = variant === 'self' ? 'bg-red-600/20' : 'bg-blue-500/20';

  return (
    <div
      className="flex items-center gap-2"
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={`w-20 h-2 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full ${bgColor} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-4 text-right tabular-nums">{value}</span>
    </div>
  );
}

function CompetencyRow({
  competency,
  maxRating,
  isLast,
}: {
  competency: Competency;
  maxRating: number;
  isLast: boolean;
}) {
  const gap = competency.mentorRating - competency.selfRating;
  const gapDirection: TrendDirection = gap > 0 ? 'up' : gap < 0 ? 'down' : 'neutral';
  const gapLabel = gap === 0 ? 'Aligned' : `${gap > 0 ? '+' : ''}${gap}`;

  return (
    <div
      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
        !isLast ? 'border-b border-gray-200' : ''
      }`}
      role="row"
    >
      <div className="col-span-6" role="cell">
        <div className="text-sm font-medium text-gray-900 mb-1">{competency.name}</div>
        <div className="text-xs text-gray-500">{competency.description}</div>
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <RatingBar
          value={competency.selfRating}
          max={maxRating}
          variant="self"
          label={`Self rating: ${competency.selfRating} out of ${maxRating}`}
        />
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <RatingBar
          value={competency.mentorRating}
          max={maxRating}
          variant="mentor"
          label={`Mentor rating: ${competency.mentorRating} out of ${maxRating}`}
        />
      </div>
      <div className="col-span-2 flex items-center justify-center" role="cell">
        <TrendIndicator direction={gapDirection} value={gapLabel} variant="pill" size="sm" />
      </div>
    </div>
  );
}

function APlayerCompetenciesSection({ items }: { items: Competency[] }) {
  const maxRating = 5;

  if (items.length === 0) {
    return (
      <section className="mb-8">
        <header className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600" aria-hidden="true">
              <Star className="w-5 h-5" />
            </span>
            <h2 className="text-gray-900 font-semibold">A-Player Competencies</h2>
          </div>
        </header>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No competency ratings for this period.</p>
        </div>
      </section>
    );
  }

  const avgSelf = items.reduce((sum, c) => sum + c.selfRating, 0) / items.length;
  const avgMentor = items.reduce((sum, c) => sum + c.mentorRating, 0) / items.length;
  const overallGap = avgMentor - avgSelf;
  const gapDirection: TrendDirection = overallGap > 0 ? 'up' : overallGap < 0 ? 'down' : 'neutral';

  return (
    <section className="mb-8">
      <header className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600" aria-hidden="true">
              <Star className="w-5 h-5" />
            </span>
            <h2 className="text-gray-900 font-semibold">A-Player Competencies</h2>
          </div>
          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" aria-hidden="true" />
              <span className="text-gray-500">Self Avg:</span>
              <span className="font-medium text-gray-900 tabular-nums">{avgSelf.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true" />
              <span className="text-gray-500">Mentor Avg:</span>
              <span className="font-medium text-gray-900 tabular-nums">{avgMentor.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendIndicator direction={gapDirection} size="sm" />
              <span className="text-gray-500">Gap:</span>
              <span
                className={`font-medium tabular-nums ${
                  overallGap > 0
                    ? 'text-green-600'
                    : overallGap < 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                {overallGap > 0 ? '+' : ''}
                {overallGap.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div
          className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200"
          role="row"
        >
          <div
            className="col-span-6 text-xs font-medium text-gray-500 uppercase tracking-wide"
            role="columnheader"
          >
            Competency
          </div>
          <div
            className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center"
            role="columnheader"
          >
            Self
          </div>
          <div
            className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center"
            role="columnheader"
          >
            Mentor
          </div>
          <div
            className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center"
            role="columnheader"
          >
            Gap
          </div>
        </div>

        {/* Table Body */}
        <div role="rowgroup">
          {items.map((competency, index) => (
            <CompetencyRow
              key={competency.id}
              competency={competency}
              maxRating={maxRating}
              isLast={index === items.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Section: Direct Reports Performance
// ============================================================================

const ratingStyles: Record<DirectReport['rating'], string> = {
  A: 'bg-green-100 text-green-700 ring-green-500/20',
  'A-': 'bg-green-50 text-green-600 ring-green-500/20',
  'B+': 'bg-blue-100 text-blue-700 ring-blue-500/20',
  B: 'bg-blue-50 text-blue-600 ring-blue-500/20',
  'B-': 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

function ReportRow({ report }: { report: DirectReport }) {
  const goalsPercent = (report.goalsCompleted / report.goalsTotal) * 100;
  const goalsVariant = goalsPercent >= 80 ? 'success' : goalsPercent >= 50 ? 'warning' : 'danger';

  return (
    <tr
      className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors group"
      role="row"
    >
      {/* Name & Role */}
      <td className="px-6 py-4" role="cell">
        <div className="flex items-center gap-3">
          <Avatar name={report.name} size="md" />
          <div>
            <div className="text-sm font-medium text-gray-900">{report.name}</div>
            <div className="text-xs text-gray-500">{report.role}</div>
          </div>
        </div>
      </td>

      {/* Scorecard */}
      <td className="px-6 py-4" role="cell">
        <div className="flex items-center gap-2">
          <CircularProgress
            value={report.scorecardScore}
            max={100}
            size={48}
            strokeWidth={4}
            variant="auto"
            label={
              <span className="text-xs font-semibold text-gray-900">{report.scorecardScore}</span>
            }
            ariaLabel={`Scorecard score: ${report.scorecardScore}`}
          />
          <TrendIndicator direction={report.scorecardTrend} variant="minimal" size="sm" />
        </div>
      </td>

      {/* Goals Progress */}
      <td className="px-6 py-4" role="cell">
        <div className="w-32">
          <div className="text-xs text-gray-500 mb-1">
            {report.goalsCompleted}/{report.goalsTotal} complete
          </div>
          <ProgressBar
            value={report.goalsCompleted}
            max={report.goalsTotal}
            size="md"
            variant={goalsVariant}
            ariaLabel={`Goals progress: ${report.goalsCompleted} of ${report.goalsTotal}`}
          />
        </div>
      </td>

      {/* Programs */}
      <td className="px-6 py-4" role="cell">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
          <span
            className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-900">{report.programsActive} Active</span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-6 py-4" role="cell">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ring-2 ${ratingStyles[report.rating]}`}
          aria-label={`Rating: ${report.rating}`}
        >
          {report.rating}
        </span>
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right" role="cell">
        <button
          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          aria-label={`View details for ${report.name}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

function DirectReportsSection({ tenantId }: { tenantId: string | null }) {
  const { data: reports, isLoading } = useDirectReports(tenantId);

  return (
    <section className="mb-8">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600" aria-hidden="true">
            <Users className="w-5 h-5" />
          </span>
          <h2 className="text-gray-900 font-semibold">Direct Reports Performance</h2>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No direct reports configured. Set a manager in user profiles to populate this section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr role="row">
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    role="columnheader"
                    scope="col"
                  >
                    Name
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    role="columnheader"
                    scope="col"
                  >
                    Scorecard
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    role="columnheader"
                    scope="col"
                  >
                    Goals Progress
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    role="columnheader"
                    scope="col"
                  >
                    Programs
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide"
                    role="columnheader"
                    scope="col"
                  >
                    Rating
                  </th>
                  <th className="px-6 py-4" role="columnheader" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {reports.map((report) => (
                  <ReportRow key={report.id} report={report} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Section: Organizational Health Score
// ============================================================================

function HealthCard({ category }: { category: HealthCategory }) {
  const trendValue =
    category.trend === 'neutral' ? '0' : `${category.change > 0 ? '+' : ''}${category.change}`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col items-center">
      <CircularProgress
        value={category.score}
        max={100}
        size={80}
        strokeWidth={6}
        variant="auto"
        ariaLabel={`${category.name} score: ${category.score}`}
      />
      <div className="mt-3 text-sm font-medium text-gray-900">{category.name}</div>
      <div className="mt-2">
        <TrendIndicator direction={category.trend} value={trendValue} variant="pill" size="sm" />
      </div>
    </div>
  );
}

function OrganizationalHealthSection({ tenantId }: { tenantId: string | null }) {
  const { data: categories, isLoading } = useOrgHealth(tenantId);
  const displayCategories: OrgHealthCategory[] =
    categories && categories.length > 0 ? categories : [];
  const avgScore =
    displayCategories.length > 0
      ? Math.round(
          displayCategories.reduce((sum, c) => sum + c.score, 0) / displayCategories.length
        )
      : 0;

  return (
    <section className="mb-8">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600" aria-hidden="true">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-gray-900 font-semibold">Organizational Health Score</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
            <span className="text-sm text-gray-500">Overall:</span>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{avgScore}</span>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          No scorecard metric data available for this period.
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          role="list"
          aria-label="Organizational health categories"
        >
          {displayCategories.map((category) => (
            <HealthCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ScorecardPage() {
  const { user } = useAuth();
  const isAgencyUser = !!(user?.agencyId && !user?.tenantId);
  const { data: tenants } = useTenants();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (isAgencyUser && tenants?.length && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isAgencyUser, tenants, selectedTenantId]);

  const tenantId = isAgencyUser ? selectedTenantId : (user?.tenantId ?? null);

  // Period state — initialized from API data
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const { data: periodsData } = useScorecardPeriods(tenantId);
  const periods = periodsData ?? [];

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  const { data: scorecardData, isLoading } = useScorecard(tenantId, selectedPeriod || undefined);
  const { data: profileData } = useMyProfile();

  const handleExport = useCallback(() => {
    if (!scorecardData || !selectedPeriod) return;

    const lines: string[] = [];
    lines.push(`Executive Scorecard - ${selectedPeriod}`);
    lines.push(`Overall Score: ${scorecardData.overallScore ?? 'N/A'}%`);
    lines.push('');

    // Accountabilities
    lines.push('ACCOUNTABILITIES');
    for (const item of scorecardData.items ?? []) {
      lines.push(`  ${item.title}: ${item.score ?? 'N/A'}/10`);
    }
    lines.push('');

    // KPIs by category
    lines.push('KEY PERFORMANCE INDICATORS');
    for (const cat of scorecardData.metricCategories ?? []) {
      lines.push(`  ${cat.category}`);
      for (const m of cat.metrics) {
        lines.push(
          `    ${m.name}: ${m.actualValue ?? 'N/A'} / ${m.targetValue ?? 'N/A'} (${m.trend ?? 'neutral'})`
        );
      }
    }
    lines.push('');

    // Competencies
    lines.push('COMPETENCIES');
    for (const c of scorecardData.competencies ?? []) {
      lines.push(
        `  ${c.name}: Self ${c.selfRating ?? 'N/A'} | Manager ${c.managerRating ?? 'N/A'}`
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scorecard-${selectedPeriod}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedPeriod, scorecardData]);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
  }, []);

  // Map API data to internal types
  const accountabilities = (scorecardData?.items ?? []).map(mapApiItem);
  const kpiCategories = (scorecardData?.metricCategories ?? []).map(mapApiCategory);
  const competencies = (scorecardData?.competencies ?? []).map(mapApiCompetency);
  const overallScore = scorecardData?.overallScore ?? 0;
  const userRole = profileData?.title ?? '';
  const userMission = profileData?.metadata?.bio ?? '';

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Executive Scorecard</h1>
            <p className="text-gray-500">
              Strategic performance dashboard for organizational leadership
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Agency user tenant selector */}
            {isAgencyUser && tenants && tenants.length > 0 && (
              <select
                value={selectedTenantId ?? ''}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                aria-label="Select client"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <label htmlFor="period-select" className="sr-only">
              Select reporting period
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={handlePeriodChange}
              disabled={periods.length === 0}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:opacity-50"
            >
              {periods.length === 0 ? (
                <option value="">Loading periods…</option>
              ) : (
                periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Role & Mission Card */}
          <RoleMissionSection role={userRole} mission={userMission} score={overallScore} />

          {/* Key Accountabilities */}
          <KeyAccountabilitiesSection items={accountabilities} />

          {/* KPI Dashboard */}
          <KPIDashboardSection categories={kpiCategories} />

          {/* A-Player Competencies */}
          <APlayerCompetenciesSection items={competencies} />

          {/* Direct Reports Performance */}
          <DirectReportsSection tenantId={tenantId} />

          {/* Organizational Health Score */}
          <OrganizationalHealthSection tenantId={tenantId} />
        </>
      )}
    </div>
  );
}
