'use client';

import { useState, useCallback } from 'react';
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
  LucideIcon,
} from 'lucide-react';

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

// ============================================================================
// Mock Data
// ============================================================================

const PERIOD_OPTIONS = ['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

const DEFAULT_ROLE = 'Chief Executive Officer';
const DEFAULT_MISSION =
  'Lead the company to profitable, scalable growth by setting strategic direction, strengthening operational performance, building a high-performance leadership team, and positioning the brand as a trusted industry leader in both raw and value-added chicken products.';
const DEFAULT_SCORE = 87;
const DEFAULT_TREND = 5;

const accountabilities: Accountability[] = [
  {
    id: 'acc-1',
    title: 'Strategic Direction & Vision',
    description:
      'Establish and execute a 3-5 year growth strategy aligned with market trends and company capabilities',
    score: 92,
    status: 'on-track',
  },
  {
    id: 'acc-2',
    title: 'Revenue & Profit Growth',
    description:
      'Achieve YoY revenue growth of X%, with margin expansion. Balance growth between raw and cooked segments',
    score: 88,
    status: 'on-track',
  },
  {
    id: 'acc-3',
    title: 'Operational Excellence',
    description:
      'Partner with President/COO to drive efficiencies and throughput. Benchmark OEE >85%',
    score: 78,
    status: 'at-risk',
  },
  {
    id: 'acc-4',
    title: 'Brand Expansion',
    description:
      'Grow brand awareness and trust in both B2B and retail channels; launch national campaigns',
    score: 85,
    status: 'on-track',
  },
  {
    id: 'acc-5',
    title: 'Talent & Culture',
    description:
      'Attract and retain A-player executives; achieve >90% leadership retention; drive high-performance culture',
    score: 90,
    status: 'on-track',
  },
  {
    id: 'acc-6',
    title: 'Board & Investor Relations',
    description:
      'Maintain transparent communication and trust. Deliver consistent performance against board-approved metrics',
    score: 94,
    status: 'on-track',
  },
  {
    id: 'acc-7',
    title: 'M&A/Strategic Partnerships',
    description:
      'Lead successful acquisitions or joint ventures to strengthen capabilities, market share, or capacity',
    score: 72,
    status: 'needs-attention',
  },
  {
    id: 'acc-8',
    title: 'Compliance & Risk Oversight',
    description:
      'Ensure regulatory and food safety compliance; zero critical violations; proactively mitigate risk',
    score: 96,
    status: 'on-track',
  },
];

const kpiCategories: KPICategory[] = [
  {
    id: 'financial',
    name: 'Financial',
    iconName: 'DollarSign',
    kpis: [
      { id: 'f1', label: 'EBITDA', value: '$24.5M', target: '$23M', change: '+6.5%', trend: 'up' },
      { id: 'f2', label: 'Net Margin %', value: '8.2%', target: '8.0%', change: '+0.3%', trend: 'up' },
      { id: 'f3', label: 'Revenue Growth %', value: '12.4%', target: '10%', change: '+2.4%', trend: 'up' },
      { id: 'f4', label: 'ROIC', value: '14.8%', target: '15%', change: '-0.5%', trend: 'down' },
    ],
  },
  {
    id: 'operational',
    name: 'Operational',
    iconName: 'Factory',
    kpis: [
      { id: 'o1', label: 'Plant OEE', value: '82.3%', target: '85%', change: '-2.7%', trend: 'down' },
      { id: 'o2', label: 'Yield %', value: '94.1%', target: '95%', change: '0%', trend: 'neutral' },
      { id: 'o3', label: 'Downtime Hours', value: '124', target: '<100', change: '+24%', trend: 'down' },
      { id: 'o4', label: 'Throughput/Shift', value: '12.8K lbs', target: '13K lbs', change: '+3%', trend: 'up' },
    ],
  },
  {
    id: 'market-growth',
    name: 'Market Growth',
    iconName: 'TrendingUp',
    kpis: [
      { id: 'm1', label: 'Market Share (Cooked)', value: '18.2%', target: '20%', change: '+1.5%', trend: 'up' },
      { id: 'm2', label: 'New Product Revenue %', value: '15%', target: '12%', change: '+3%', trend: 'up' },
      { id: 'm3', label: 'Customer Retention', value: '94%', target: '95%', change: '-1%', trend: 'down' },
    ],
  },
  {
    id: 'people-culture',
    name: 'People & Culture',
    iconName: 'Users',
    kpis: [
      { id: 'p1', label: '% A-Players in Leadership', value: '78%', target: '80%', change: '+5%', trend: 'up' },
      { id: 'p2', label: 'Engagement Score', value: '87%', target: '85%', change: '+2%', trend: 'up' },
      { id: 'p3', label: 'Executive Team Stability', value: '92%', target: '90%', change: '+2%', trend: 'up' },
    ],
  },
  {
    id: 'compliance-safety',
    name: 'Compliance & Safety',
    iconName: 'Shield',
    kpis: [
      { id: 'c1', label: 'USDA/FDA Audit Score', value: '98', target: '>95', change: '+3%', trend: 'up' },
      { id: 'c2', label: 'Critical Violations', value: '0', target: '0', change: '0', trend: 'neutral' },
      { id: 'c3', label: 'TRIR', value: '2.1', target: '<2.5', change: '-15%', trend: 'up', invertTrend: true },
    ],
  },
  {
    id: 'brand-strength',
    name: 'Brand Strength',
    iconName: 'Award',
    kpis: [
      { id: 'b1', label: 'National Distribution Points', value: '8,420', target: '9,000', change: '+12%', trend: 'up' },
      { id: 'b2', label: 'Brand Recall Rate', value: '42%', target: '45%', change: '+3%', trend: 'up' },
      { id: 'b3', label: 'NPS (B2B & Retail)', value: '67', target: '70', change: '+5', trend: 'up' },
    ],
  },
];

const competencies: Competency[] = [
  { id: 'comp-1', name: 'Visionary Leadership', description: 'Sees around corners and guides the company toward strategic advantage', selfRating: 4, mentorRating: 4 },
  { id: 'comp-2', name: 'Financial Acumen', description: 'Deep P&L mastery; understands drivers of value creation', selfRating: 5, mentorRating: 5 },
  { id: 'comp-3', name: 'Influence & Communication', description: 'Inspires trust with board, customers, regulators, and employees', selfRating: 4, mentorRating: 5 },
  { id: 'comp-4', name: 'Talent Magnet', description: 'Attracts and retains top executives and key talent', selfRating: 4, mentorRating: 4 },
  { id: 'comp-5', name: 'Operational Savvy', description: 'Understands complexities of vertically integrated food processing', selfRating: 3, mentorRating: 3 },
  { id: 'comp-6', name: 'Customer Intuition', description: 'Understands evolving customer demands across channels', selfRating: 4, mentorRating: 4 },
  { id: 'comp-7', name: 'Execution Focus', description: 'Drives accountability and consistent delivery against critical goals', selfRating: 5, mentorRating: 4 },
  { id: 'comp-8', name: 'Crisis Leadership', description: 'Maintains clarity and calm in times of volatility', selfRating: 4, mentorRating: 5 },
  { id: 'comp-9', name: 'High Integrity', description: 'Embodies ethical, safety-first, and compliant business conduct', selfRating: 5, mentorRating: 5 },
];

const directReports: DirectReport[] = [
  { id: 'dr-1', name: 'Sarah Mitchell', role: 'President/COO', scorecardScore: 89, scorecardTrend: 'up', goalsCompleted: 5, goalsTotal: 6, programsActive: 2, rating: 'A' },
  { id: 'dr-2', name: 'Marcus Chen', role: 'CFO', scorecardScore: 92, scorecardTrend: 'up', goalsCompleted: 4, goalsTotal: 4, programsActive: 1, rating: 'A' },
  { id: 'dr-3', name: 'Jennifer Lopez', role: 'CMO', scorecardScore: 85, scorecardTrend: 'up', goalsCompleted: 3, goalsTotal: 5, programsActive: 3, rating: 'A-' },
  { id: 'dr-4', name: 'David Park', role: 'VP Operations', scorecardScore: 78, scorecardTrend: 'up', goalsCompleted: 2, goalsTotal: 4, programsActive: 2, rating: 'B+' },
  { id: 'dr-5', name: 'Amanda Brooks', role: 'VP Sales', scorecardScore: 88, scorecardTrend: 'up', goalsCompleted: 6, goalsTotal: 7, programsActive: 1, rating: 'A' },
];

const healthCategories: HealthCategory[] = [
  { id: 'health-1', name: 'Strategy', score: 88, change: 3, trend: 'up' },
  { id: 'health-2', name: 'Execution', score: 82, change: 0, trend: 'neutral' },
  { id: 'health-3', name: 'Culture', score: 90, change: 3, trend: 'up' },
  { id: 'health-4', name: 'Learning', score: 85, change: 3, trend: 'up' },
  { id: 'health-5', name: 'Innovation', score: 78, change: -2, trend: 'down' },
];

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
  const statusConfig: Record<string, { icon: LucideIcon; bg: string; text: string; border: string }> = {
    success: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    danger: { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    info: { icon: CheckCircle2, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    neutral: { icon: CheckCircle2, bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
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
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };

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

function RoleMissionSection() {
  const trendDirection: TrendDirection = DEFAULT_TREND > 0 ? 'up' : DEFAULT_TREND < 0 ? 'down' : 'neutral';
  const trendValue = `${DEFAULT_TREND > 0 ? '+' : ''}${DEFAULT_TREND} vs Q4`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
        {/* Left: Role & Mission */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-600" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{DEFAULT_ROLE}</h2>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mission</div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">{DEFAULT_MISSION}</p>
        </div>

        {/* Right: Score Gauge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 text-center">
            Overall Score
          </div>
          <CircularProgress
            value={DEFAULT_SCORE}
            max={100}
            size={120}
            strokeWidth={10}
            variant="auto"
            label={
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-gray-900">{DEFAULT_SCORE}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            }
            ariaLabel={`Overall score: ${DEFAULT_SCORE} out of 100`}
          />
          <div className="mt-3">
            <TrendIndicator direction={trendDirection} value={trendValue} variant="pill" size="md" />
          </div>
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

function KeyAccountabilitiesSection() {
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

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        role="list"
        aria-label="Key accountabilities"
      >
        {accountabilities.map((item) => {
          const status = accountabilityStatusMap[item.status];
          const progressVariant =
            item.status === 'on-track' ? 'success' : item.status === 'at-risk' ? 'warning' : 'danger';

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
                  <StatusBadge status={status.type} label={status.label} showIcon={false} size="sm" />
                </div>
              </div>
              <ProgressBar value={item.score} max={100} variant={progressVariant} size="md" ariaLabel={`Progress: ${item.score}%`} />
            </div>
          );
        })}
      </div>
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
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</span>
        <TrendIndicator direction={kpi.trend} value={kpi.change} variant="pill" iconStyle="arrow" size="sm" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-3">{kpi.value}</div>
      <div className="flex items-center gap-2">
        <ProgressBar value={75} max={100} size="sm" variant={progressVariant} className="flex-1" ariaLabel={`Target progress for ${kpi.label}`} />
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

function KPIDashboardSection() {
  return (
    <section className="mb-8">
      <header className="mb-4">
        <h2 className="text-gray-900 font-semibold">Key Performance Indicators</h2>
      </header>
      <div className="space-y-6" role="list" aria-label="KPI categories">
        {kpiCategories.map((category) => (
          <KPICategoryCardInline key={category.id} category={category} />
        ))}
      </div>
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

function APlayerCompetenciesSection() {
  const maxRating = 5;
  const avgSelf = competencies.reduce((sum, c) => sum + c.selfRating, 0) / competencies.length;
  const avgMentor = competencies.reduce((sum, c) => sum + c.mentorRating, 0) / competencies.length;
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
                  overallGap > 0 ? 'text-green-600' : overallGap < 0 ? 'text-red-600' : 'text-gray-500'
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
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200" role="row">
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
          {competencies.map((competency, index) => (
            <CompetencyRow
              key={competency.id}
              competency={competency}
              maxRating={maxRating}
              isLast={index === competencies.length - 1}
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
    <tr className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors group" role="row">
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
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
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

function DirectReportsSection() {
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
              {directReports.map((report) => (
                <ReportRow key={report.id} report={report} />
              ))}
            </tbody>
          </table>
        </div>
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

function OrganizationalHealthSection() {
  const avgScore = Math.round(
    healthCategories.reduce((sum, c) => sum + c.score, 0) / healthCategories.length
  );

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

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        role="list"
        aria-label="Organizational health categories"
      >
        {healthCategories.map((category) => (
          <HealthCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ScorecardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Q1 2026');

  const handleExport = useCallback(() => {
    // In a real app, this would trigger a report export
    console.log(`Exporting report for ${selectedPeriod}`);
  }, [selectedPeriod]);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value as Period);
  }, []);

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
          <div className="flex items-center gap-3">
            <label htmlFor="period-select" className="sr-only">
              Select reporting period
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
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

      {/* Role & Mission Card */}
      <RoleMissionSection />

      {/* Key Accountabilities */}
      <KeyAccountabilitiesSection />

      {/* KPI Dashboard */}
      <KPIDashboardSection />

      {/* A-Player Competencies */}
      <APlayerCompetenciesSection />

      {/* Direct Reports Performance */}
      <DirectReportsSection />

      {/* Organizational Health Score */}
      <OrganizationalHealthSection />
    </div>
  );
}
