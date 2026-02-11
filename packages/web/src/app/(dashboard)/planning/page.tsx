'use client';

import { useState, useCallback } from 'react';
import {
  Calendar,
  Target,
  CheckCircle2,
  TrendingUp,
  Filter,
  Plus,
  Users,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Link as LinkIcon,
  DollarSign,
  Factory,
  Award,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProgressStatus = 'on-track' | 'at-risk' | 'needs-attention';
type GoalType = 'company' | 'team' | 'personal';
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

interface Pillar {
  id: string;
  name: string;
  target: string;
  progress: number;
  initiatives: number;
  status: ProgressStatus;
}

interface Objective {
  id: string;
  title: string;
  owner: string;
  ownerRole: string;
  category: string;
  activeQuarters: Quarter[];
  progress: number;
  status: ProgressStatus;
}

interface Priority {
  id: string;
  title: string;
  category: string;
  owner: string;
  ownerRole: string;
  dueDate: string;
  actionsCompleted: number;
  actionsTotal: number;
  status: ProgressStatus;
}

interface ActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  type: GoalType;
  category: string;
  owner: string;
  ownerRole: string;
  dueDate: string;
  scorecardLink?: string;
  progress: number;
  currentValue: string;
  targetValue: string;
  status: ProgressStatus;
}

interface GoalStats {
  total: number;
  newThisQuarter: number;
  onTrack: number;
  atRisk: number;
  needsAttention: number;
}

interface QuarterOverview {
  theme: string;
  prioritiesActive: number;
  actionItemsTotal: number;
  actionItemsComplete: number;
  completionPercent: number;
}

interface AnnualPlan {
  year: number;
  completionPercent: number;
  quartersComplete: number;
  totalQuarters: number;
}

interface KPIMetric {
  id: string;
  name: string;
  value: string;
  target: string;
  change: string;
  changeDirection: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface KPICategory {
  id: string;
  name: string;
  icon: string;
  metrics: KPIMetric[];
  columns: number;
}

interface ScorecardOption {
  id: string;
  name: string;
  description: string;
  score: number;
  status: ProgressStatus;
}

interface GoalSuggestion {
  id: string;
  title: string;
  category: string;
  reason: string;
  scorecardLink: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
}

interface GoalFormData {
  statement: string;
  type: string;
  category: string;
  owner: string;
  startDate: string;
  targetDate: string;
  activeQuarters: string[];
  currentValue: string;
  currentUnit: string;
  targetValue: string;
  targetUnit: string;
  measurementFrequency: string;
  milestones: Milestone[];
  scorecardLink: string;
  annualPlanLink: string;
  programLink: string;
  visibleToReports: boolean;
  addToDashboard: boolean;
  enableAIMentoring: boolean;
  accountabilityPartner: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const defaultAnnualPlan: AnnualPlan = {
  year: 2026,
  completionPercent: 68,
  quartersComplete: 8,
  totalQuarters: 12,
};

const defaultPillars: Pillar[] = [
  {
    id: 'pillar-1',
    name: 'Profitable Growth',
    target: '$250M Revenue | 12% EBITDA',
    progress: 72,
    initiatives: 8,
    status: 'on-track',
  },
  {
    id: 'pillar-2',
    name: 'Operational Excellence',
    target: '85% OEE | <2% Waste',
    progress: 58,
    initiatives: 6,
    status: 'at-risk',
  },
  {
    id: 'pillar-3',
    name: 'Market Leadership',
    target: '20% Market Share | Top 3 Brand',
    progress: 65,
    initiatives: 5,
    status: 'on-track',
  },
];

const defaultObjectives: Objective[] = [
  {
    id: 'obj-1',
    title: 'Achieve $250M in total revenue with balanced growth across raw and cooked segments',
    owner: 'CEO',
    ownerRole: 'CEO',
    category: 'Financial',
    activeQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    progress: 78,
    status: 'on-track',
  },
  {
    id: 'obj-2',
    title: 'Expand national distribution to 9,000+ retail points',
    owner: 'CMO',
    ownerRole: 'CMO',
    category: 'Market Growth',
    activeQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    progress: 62,
    status: 'on-track',
  },
  {
    id: 'obj-3',
    title: 'Improve plant OEE to 85%',
    owner: 'COO',
    ownerRole: 'COO',
    category: 'Operational',
    activeQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    progress: 54,
    status: 'at-risk',
  },
  {
    id: 'obj-4',
    title: 'Build executive bench strength - 80% A-players',
    owner: 'CEO',
    ownerRole: 'CEO',
    category: 'People',
    activeQuarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    progress: 70,
    status: 'on-track',
  },
  {
    id: 'obj-5',
    title: 'Launch 3 new value-added product lines',
    owner: 'CMO',
    ownerRole: 'CMO',
    category: 'Innovation',
    activeQuarters: ['Q2', 'Q3', 'Q4'],
    progress: 45,
    status: 'needs-attention',
  },
];

const defaultQuarterOverview: QuarterOverview = {
  theme: 'Foundation & Momentum',
  prioritiesActive: 12,
  actionItemsTotal: 47,
  actionItemsComplete: 32,
  completionPercent: 68,
};

const defaultPriorities: Priority[] = [
  {
    id: 'priority-1',
    title: 'Complete operational audit and implement Q1 efficiency improvements',
    category: 'Operational Excellence',
    owner: 'Sarah Mitchell',
    ownerRole: 'President/COO',
    dueDate: 'Mar 31, 2026',
    actionsCompleted: 6,
    actionsTotal: 8,
    status: 'on-track',
  },
  {
    id: 'priority-2',
    title: 'Launch national marketing campaign',
    category: 'Market Leadership',
    owner: 'Jennifer Lopez',
    ownerRole: 'CMO',
    dueDate: 'Feb 28, 2026',
    actionsCompleted: 10,
    actionsTotal: 12,
    status: 'on-track',
  },
  {
    id: 'priority-3',
    title: 'Close acquisition of regional distributor',
    category: 'Profitable Growth',
    owner: 'You',
    ownerRole: 'CEO',
    dueDate: 'Mar 15, 2026',
    actionsCompleted: 3,
    actionsTotal: 6,
    status: 'at-risk',
  },
  {
    id: 'priority-4',
    title: 'Execute LeaderShift program',
    category: 'People & Culture',
    owner: 'You',
    ownerRole: 'CEO',
    dueDate: 'Mar 31, 2026',
    actionsCompleted: 4,
    actionsTotal: 5,
    status: 'on-track',
  },
];

const defaultActionItems: ActionItem[] = [
  { id: 'action-1', title: 'Review and approve Q1 marketing budget allocation', owner: 'CMO', dueDate: 'Jan 17', completed: false },
  { id: 'action-2', title: 'Finalize acquisition due diligence', owner: 'CFO', dueDate: 'Jan 18', completed: false },
  { id: 'action-3', title: 'Conduct LeaderShift Module 3 session', owner: 'You', dueDate: 'Jan 16', completed: true },
  { id: 'action-4', title: 'Review plant efficiency metrics', owner: 'You', dueDate: 'Jan 19', completed: false },
  { id: 'action-5', title: 'Approve new product launch timeline', owner: 'CMO', dueDate: 'Jan 20', completed: false },
  { id: 'action-6', title: 'Meet with board compensation committee', owner: 'You', dueDate: 'Jan 18', completed: true },
];

const defaultGoalStats: GoalStats = {
  total: 18,
  newThisQuarter: 3,
  onTrack: 12,
  atRisk: 4,
  needsAttention: 2,
};

const defaultGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Increase EBITDA to $24M by end of Q1 2026',
    type: 'company',
    category: 'Financial',
    owner: 'Marcus Chen',
    ownerRole: 'CFO',
    dueDate: 'Mar 31, 2026',
    scorecardLink: 'Revenue & Profit Growth',
    progress: 78,
    currentValue: '$22.8M',
    targetValue: '$24M',
    status: 'on-track',
  },
  {
    id: 'goal-2',
    title: 'Achieve 85% OEE across all plants',
    type: 'company',
    category: 'Operational',
    owner: 'Sarah Mitchell',
    ownerRole: 'COO',
    dueDate: 'Jun 30, 2026',
    scorecardLink: 'Operational Excellence',
    progress: 54,
    currentValue: '82.3%',
    targetValue: '85%',
    status: 'at-risk',
  },
  {
    id: 'goal-3',
    title: 'Complete LeaderShift with 90%+ engagement',
    type: 'team',
    category: 'People',
    owner: 'You',
    ownerRole: 'CEO',
    dueDate: 'Mar 31, 2026',
    scorecardLink: 'Talent & Culture',
    progress: 82,
    currentValue: 'Module 7',
    targetValue: 'Module 9',
    status: 'on-track',
  },
  {
    id: 'goal-4',
    title: 'Expand distribution to 9,000 retail points',
    type: 'company',
    category: 'Market Growth',
    owner: 'Jennifer Lopez',
    ownerRole: 'CMO',
    dueDate: 'Dec 31, 2026',
    scorecardLink: 'Market Expansion',
    progress: 62,
    currentValue: '8,420',
    targetValue: '9,000',
    status: 'on-track',
  },
  {
    id: 'goal-5',
    title: 'Launch 3 new value-added product SKUs',
    type: 'team',
    category: 'Innovation',
    owner: 'Jennifer Lopez',
    ownerRole: 'CMO',
    dueDate: 'Sep 30, 2026',
    scorecardLink: 'Innovation Pipeline',
    progress: 33,
    currentValue: '1',
    targetValue: '3 products',
    status: 'needs-attention',
  },
  {
    id: 'goal-6',
    title: 'Achieve 80% A-player rating',
    type: 'personal',
    category: 'People',
    owner: 'You',
    ownerRole: 'CEO',
    dueDate: 'Dec 31, 2026',
    scorecardLink: 'Executive Bench Strength',
    progress: 78,
    currentValue: '78%',
    targetValue: '80%',
    status: 'on-track',
  },
];

const defaultKPICategories: KPICategory[] = [
  {
    id: 'kpi-financial',
    name: 'Financial Performance',
    icon: 'DollarSign',
    columns: 4,
    metrics: [
      { id: 'metric-1', name: 'Revenue', value: '$62.5M', target: '$62M', change: '+0.8%', changeDirection: 'up', unit: 'Quarterly' },
      { id: 'metric-2', name: 'EBITDA', value: '$24.5M', target: '$23M', change: '+6.5%', changeDirection: 'up', unit: 'Annual Run Rate' },
      { id: 'metric-3', name: 'Net Margin', value: '8.2%', target: '8.0%', change: '+0.3%', changeDirection: 'up', unit: '%' },
      { id: 'metric-4', name: 'ROIC', value: '14.8%', target: '15%', change: '-0.5%', changeDirection: 'down', unit: '%' },
    ],
  },
  {
    id: 'kpi-operational',
    name: 'Operational Efficiency',
    icon: 'Factory',
    columns: 4,
    metrics: [
      { id: 'metric-5', name: 'Plant OEE', value: '82.3%', target: '85%', change: '-2.7%', changeDirection: 'down' },
      { id: 'metric-6', name: 'Product Yield', value: '94.1%', target: '95%', change: '0%', changeDirection: 'neutral' },
      { id: 'metric-7', name: 'Throughput/Shift', value: '12.8K lbs', target: '13K lbs', change: '+3%', changeDirection: 'up' },
      { id: 'metric-8', name: 'Downtime Hours', value: '124hrs', target: '<100hrs', change: '+24%', changeDirection: 'down' },
    ],
  },
  {
    id: 'kpi-people',
    name: 'People & Culture',
    icon: 'Users',
    columns: 3,
    metrics: [
      { id: 'metric-9', name: 'A-Player %', value: '78%', target: '80%', change: '+5%', changeDirection: 'up' },
      { id: 'metric-10', name: 'Engagement Score', value: '87%', target: '85%', change: '+2%', changeDirection: 'up' },
      { id: 'metric-11', name: 'Leadership Retention', value: '92%', target: '90%', change: '+2%', changeDirection: 'up' },
    ],
  },
  {
    id: 'kpi-market',
    name: 'Market Growth',
    icon: 'Award',
    columns: 3,
    metrics: [
      { id: 'metric-12', name: 'Market Share', value: '18.2%', target: '20%', change: '+1.5%', changeDirection: 'up' },
      { id: 'metric-13', name: 'Distribution Points', value: '8,420', target: '9,000', change: '+12%', changeDirection: 'up' },
      { id: 'metric-14', name: 'Brand NPS', value: '67', target: '70', change: '+5', changeDirection: 'up' },
    ],
  },
];

const defaultScorecardOptions: ScorecardOption[] = [
  { id: 'scorecard-1', name: 'Operational Excellence', description: 'Partner with COO to drive efficiencies', score: 78, status: 'at-risk' },
  { id: 'scorecard-2', name: 'Revenue & Profit Growth', description: 'Achieve profitable growth targets', score: 88, status: 'on-track' },
  { id: 'scorecard-3', name: 'Talent & Culture', description: 'Build high-performance leadership team', score: 90, status: 'on-track' },
];

const defaultGoalSuggestions: GoalSuggestion[] = [
  {
    id: 'suggestion-1',
    title: 'Improve Plant OEE from 82.3% to 85%',
    category: 'Operational',
    reason: 'Your Operational Excellence accountability is at risk (78 score)',
    scorecardLink: 'Scorecard: Operational Excellence',
  },
  {
    id: 'suggestion-2',
    title: 'Close 2 strategic M&A deals in Q2-Q3 2026',
    category: 'Growth',
    reason: 'Strategic Expansion accountability needs attention (72 score)',
    scorecardLink: 'Scorecard: Strategic Expansion',
  },
  {
    id: 'suggestion-3',
    title: 'Launch innovation lab for new product development',
    category: 'Innovation',
    reason: 'Innovation Pipeline accountability maintains momentum (85 score)',
    scorecardLink: 'Scorecard: Innovation Pipeline',
  },
];

const goalOwnerOptions = [
  { value: 'you', label: 'You (CEO)' },
  { value: 'sarah', label: 'Sarah Mitchell (President/COO)' },
  { value: 'marcus', label: 'Marcus Chen (CFO)' },
  { value: 'jennifer', label: 'Jennifer Lopez (CMO)' },
  { value: 'david', label: 'David Park (VP Operations)' },
  { value: 'amanda', label: 'Amanda Brooks (VP Sales)' },
];

const goalTypeOptions = [
  { value: 'company', label: 'Company Goal' },
  { value: 'team', label: 'Team Goal' },
  { value: 'personal', label: 'Personal Goal' },
];

const goalCategoryOptions = [
  { value: 'financial', label: 'Financial' },
  { value: 'operational', label: 'Operational' },
  { value: 'market-growth', label: 'Market Growth' },
  { value: 'people', label: 'People & Culture' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'compliance', label: 'Compliance & Safety' },
  { value: 'brand', label: 'Brand Strength' },
];

const measurementFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const annualPlanLinkOptions = [
  { value: 'none', label: 'No link' },
  { value: 'profitable-growth', label: 'Profitable Growth Pillar' },
  { value: 'operational-excellence', label: 'Operational Excellence Pillar' },
  { value: 'market-leadership', label: 'Market Leadership Pillar' },
];

const programLinkOptions = [
  { value: 'none', label: 'No link' },
  { value: 'leadershift', label: 'LeaderShift: Leading through Change' },
  { value: 'executive-excellence', label: 'Executive Excellence Program' },
  { value: 'team-building', label: 'High-Performance Team Building' },
];

const accountabilityPartnerOptions = [
  { value: 'none', label: 'No partner' },
  { value: 'sarah', label: 'Sarah Mitchell (President/COO)' },
  { value: 'marcus', label: 'Marcus Chen (CFO)' },
  { value: 'jennifer', label: 'Jennifer Lopez (CMO)' },
  { value: 'mentor', label: 'Your Executive Mentor' },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const pillarStatusConfig: Record<ProgressStatus, { border: string; progressBg: string; text: string; label: string }> = {
  'on-track': { border: 'border-green-200', progressBg: 'bg-green-500', text: 'text-green-600', label: 'On Track' },
  'at-risk': { border: 'border-yellow-200', progressBg: 'bg-yellow-500', text: 'text-yellow-600', label: 'At Risk' },
  'needs-attention': { border: 'border-red-300', progressBg: 'bg-red-600', text: 'text-red-600', label: 'Needs Attention' },
};

const objectiveStatusConfig: Record<ProgressStatus, { border: string; progressBg: string; text: string; label: string }> = {
  'on-track': { border: 'border-gray-200', progressBg: 'bg-green-500', text: 'text-green-600', label: 'On Track' },
  'at-risk': { border: 'border-yellow-200', progressBg: 'bg-yellow-500', text: 'text-yellow-600', label: 'At Risk' },
  'needs-attention': { border: 'border-red-300', progressBg: 'bg-red-600', text: 'text-red-600', label: 'Needs Attention' },
};

const priorityStatusConfig: Record<ProgressStatus, { bgColor: string; textColor: string; label: string }> = {
  'on-track': { bgColor: 'bg-green-50', textColor: 'text-green-700', label: 'On Track' },
  'at-risk': { bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', label: 'At Risk' },
  'needs-attention': { bgColor: 'bg-red-50', textColor: 'text-red-600', label: 'Needs Attention' },
};

const goalStatusConfig: Record<ProgressStatus, { border: string; progressBg: string; text: string; label: string }> = {
  'on-track': { border: 'border-gray-200', progressBg: 'bg-green-500', text: 'text-green-600', label: 'On Track' },
  'at-risk': { border: 'border-yellow-200', progressBg: 'bg-yellow-500', text: 'text-yellow-600', label: 'At Risk' },
  'needs-attention': { border: 'border-red-300', progressBg: 'bg-red-600', text: 'text-red-600', label: 'Needs Attention' },
};

// ---------------------------------------------------------------------------
// Annual Planning Tab Sub-components
// ---------------------------------------------------------------------------

function PillarCard({ pillar }: { pillar: Pillar }) {
  const config = pillarStatusConfig[pillar.status];
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${config.border} p-5`}
      role="article"
      aria-label={`${pillar.name} pillar`}
    >
      <h4 className="text-gray-900 font-medium mb-2">{pillar.name}</h4>
      <p className="text-xs text-gray-500 mb-4">{pillar.target}</p>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{pillar.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.progressBg} rounded-full transition-all duration-300`}
            style={{ width: `${pillar.progress}%` }}
            role="progressbar"
            aria-valuenow={pillar.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pillar.name} progress: ${pillar.progress}%`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{pillar.initiatives} initiatives</span>
        <span className={config.text}>{config.label}</span>
      </div>
    </div>
  );
}

function ObjectiveCard({ objective }: { objective: Objective }) {
  const config = objectiveStatusConfig[objective.status];
  const allQuarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${config.border} hover:border-red-300 transition-colors cursor-pointer p-4`}
      role="article"
      aria-label={objective.title}
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-sm text-gray-900">{objective.title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {objective.owner}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{objective.category}</span>
            <span className="flex items-center gap-1">
              {allQuarters.map((q) => (
                <span
                  key={q}
                  className={`px-2 py-1 rounded text-xs ${
                    objective.activeQuarters.includes(q)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-50'
                  }`}
                >
                  {q}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="ml-6 text-right">
          <div className="text-2xl text-gray-900 mb-1 tabular-nums">{objective.progress}%</div>
          <div className={`text-xs ${config.text}`}>{config.label}</div>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.progressBg} rounded-full transition-all duration-300`}
          style={{ width: `${objective.progress}%` }}
          role="progressbar"
          aria-valuenow={objective.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Annual Planning Tab
// ---------------------------------------------------------------------------

function AnnualPlanningTab() {
  const plan = defaultAnnualPlan;
  const pillars = defaultPillars;
  const objectives = defaultObjectives;
  const totalObjectives = 24;

  return (
    <div>
      {/* Planning Year Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-gray-900 font-semibold mb-2">{plan.year} Annual Plan</h2>
            <p className="text-sm text-gray-500">
              Strategic priorities and objectives for the fiscal year
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1 uppercase">Plan Completion</div>
            <div className="text-3xl text-gray-900 mb-1 tabular-nums">{plan.completionPercent}%</div>
            <div className="text-xs text-gray-500">
              {plan.quartersComplete} of {plan.totalQuarters} quarters complete
            </div>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300"
            style={{ width: `${plan.completionPercent}%` }}
            role="progressbar"
            aria-valuenow={plan.completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Annual plan progress: ${plan.completionPercent}%`}
          />
        </div>
      </div>

      {/* Strategic Pillars */}
      <section className="mb-8" aria-labelledby="pillars-heading">
        <h3 id="pillars-heading" className="text-gray-900 font-semibold mb-4">
          Strategic Pillars
        </h3>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Strategic pillars"
        >
          {pillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      {/* Annual Objectives */}
      <section aria-labelledby="objectives-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="objectives-heading" className="text-gray-900 font-semibold">
            Annual Objectives
          </h3>
          <button className="text-sm text-red-600 hover:text-red-500 transition-colors">
            View All ({totalObjectives})
          </button>
        </div>
        <div className="space-y-3" role="list" aria-label="Annual objectives">
          {objectives.map((objective) => (
            <ObjectiveCard key={objective.id} objective={objective} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quarterly Planning Tab Sub-components
// ---------------------------------------------------------------------------

const QUARTER_OPTIONS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'] as const;

function PriorityCard({ priority }: { priority: Priority }) {
  const [expanded, setExpanded] = useState(false);
  const config = priorityStatusConfig[priority.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4" role="article" aria-label={priority.title}>
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
        <div className="flex-1">
          <h4 className="text-sm text-gray-900 mb-3">{priority.title}</h4>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">{priority.category}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {priority.ownerRole} - {priority.owner}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {priority.dueDate}
            </span>
          </div>
        </div>
        <div className="sm:ml-6">
          <span className={`inline-block px-3 py-1 rounded text-xs ${config.bgColor} ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Action Items Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Action Items</span>
          <span>{priority.actionsCompleted} of {priority.actionsTotal} complete</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300"
            style={{ width: `${(priority.actionsCompleted / priority.actionsTotal) * 100}%` }}
            role="progressbar"
            aria-valuenow={priority.actionsCompleted}
            aria-valuemin={0}
            aria-valuemax={priority.actionsTotal}
            aria-label={`Action items progress: ${priority.actionsCompleted} of ${priority.actionsTotal}`}
          />
        </div>
      </div>

      {/* Expandable Action Items */}
      <button
        className="flex items-center gap-2 text-xs text-red-600 hover:text-red-500 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`priority-actions-${priority.id}`}
      >
        <span>View action items</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div
          id={`priority-actions-${priority.id}`}
          className="mt-3 pt-3 border-t border-gray-200 space-y-2"
        >
          <p className="text-xs text-gray-500">
            Action items for this priority would be displayed here.
          </p>
        </div>
      )}
    </div>
  );
}

function ActionItemCard({ item, onToggle }: { item: ActionItem; onToggle?: (id: string, completed: boolean) => void }) {
  const handleToggle = useCallback(() => {
    onToggle?.(item.id, !item.completed);
  }, [item.id, item.completed, onToggle]);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-4 ${item.completed ? 'opacity-50' : ''}`}
      role="listitem"
    >
      <button
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          item.completed
            ? 'bg-red-600 border-red-600'
            : 'border-gray-200 hover:border-red-600'
        }`}
        onClick={handleToggle}
        aria-label={item.completed ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
        aria-pressed={item.completed}
      >
        {item.completed && (
          <CheckCircle2 className="w-4 h-4 text-white" aria-hidden="true" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {item.title}
        </div>
      </div>
      <div className="text-xs text-gray-500 hidden sm:block">{item.owner}</div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" aria-hidden="true" />
        {item.dueDate}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quarterly Planning Tab
// ---------------------------------------------------------------------------

function QuarterlyPlanningTab() {
  const overview = defaultQuarterOverview;
  const priorities = defaultPriorities;
  const actionItems = defaultActionItems;
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2026');
  const dateRange = 'January 1 - March 31, 2026';

  const [localActions, setLocalActions] = useState(actionItems);

  const handleActionToggle = useCallback((id: string, completed: boolean) => {
    setLocalActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed } : a))
    );
  }, []);

  return (
    <div>
      {/* Quarter Selector */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label htmlFor="quarter-select" className="sr-only">Select quarter</label>
          <select
            id="quarter-select"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            {QUARTER_OPTIONS.map((quarter) => (
              <option key={quarter} value={quarter}>{quarter}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">{dateRange}</div>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2">
          Start Q2 Planning
        </button>
      </div>

      {/* Quarter Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase">Quarterly Theme</div>
            <div className="text-sm text-gray-900">{overview.theme}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase">Priorities</div>
            <div className="text-sm text-gray-900">{overview.prioritiesActive} Active</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase">Action Items</div>
            <div className="text-sm text-gray-900">
              {overview.actionItemsTotal} Total &bull; {overview.actionItemsComplete} Complete
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase">Completion</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${overview.completionPercent}%` }}
                    role="progressbar"
                    aria-valuenow={overview.completionPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Quarter completion: ${overview.completionPercent}%`}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-900 tabular-nums">{overview.completionPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Priorities */}
      <section className="mb-8" aria-labelledby="priorities-heading">
        <h3 id="priorities-heading" className="text-gray-900 font-semibold mb-4">
          {selectedQuarter} Priorities
        </h3>
        <div className="space-y-4" role="list" aria-label="Quarterly priorities">
          {priorities.map((priority) => (
            <PriorityCard key={priority.id} priority={priority} />
          ))}
        </div>
      </section>

      {/* Weekly Action Items */}
      <section aria-labelledby="actions-heading">
        <h3 id="actions-heading" className="text-gray-900 font-semibold mb-4">
          This Week&apos;s Action Items
        </h3>
        <div className="space-y-2" role="list" aria-label="Weekly action items">
          {localActions.map((item) => (
            <ActionItemCard key={item.id} item={item} onToggle={handleActionToggle} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goals Tab Sub-components
// ---------------------------------------------------------------------------

function GoalStatCard({
  label,
  value,
  subText,
  borderColor = 'border-gray-200',
  valueColor = 'text-gray-900',
  subTextColor = 'text-gray-500',
}: {
  label: string;
  value: number;
  subText: string;
  borderColor?: string;
  valueColor?: string;
  subTextColor?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderColor} p-4`}>
      <div className="text-xs text-gray-500 mb-2 uppercase">{label}</div>
      <div className={`text-3xl ${valueColor} mb-1 tabular-nums`}>{value}</div>
      <div className={`text-xs ${subTextColor}`}>{subText}</div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const config = goalStatusConfig[goal.status];
  const typeLabels: Record<GoalType, string> = { company: 'Company', team: 'Team', personal: 'Personal' };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${config.border} hover:border-red-300 transition-colors cursor-pointer p-5`}
      role="article"
      aria-label={goal.title}
      tabIndex={0}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-sm text-gray-900">{goal.title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="px-2 py-1 bg-gray-100 rounded">{typeLabels[goal.type]}</span>
            <span className="px-2 py-1 bg-gray-100 rounded">{goal.category}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {goal.ownerRole} - {goal.owner}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {goal.dueDate}
            </span>
          </div>
          {goal.scorecardLink && (
            <div className="text-xs text-red-600">Scorecard: {goal.scorecardLink}</div>
          )}
        </div>
        <div className="sm:ml-6 text-right">
          <div className="text-2xl text-gray-900 mb-1 tabular-nums">{goal.progress}%</div>
          <div className={`text-xs ${config.text} mb-2`}>{config.label}</div>
          <div className="text-xs text-gray-500">
            {goal.currentValue} / {goal.targetValue}
          </div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.progressBg} rounded-full transition-all duration-300`}
          style={{ width: `${goal.progress}%` }}
          role="progressbar"
          aria-valuenow={goal.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Goal progress: ${goal.progress}%`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goals Tab
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'my' | 'team' | 'company';

function GoalsTab() {
  const stats = defaultGoalStats;
  const goals = defaultGoals;
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Goals', count: stats.total },
    { id: 'my', label: 'My Goals', count: 8 },
    { id: 'team', label: 'Team Goals', count: 10 },
    { id: 'company', label: 'Company Goals', count: 6 },
  ];

  const filteredGoals = goals.filter((goal) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'my') return goal.owner === 'You';
    if (activeFilter === 'team') return goal.type === 'team';
    if (activeFilter === 'company') return goal.type === 'company';
    return true;
  });

  return (
    <div>
      {/* Goals Summary Stats */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Goals summary statistics">
        <GoalStatCard
          label="Total Goals"
          value={stats.total}
          subText={`+${stats.newThisQuarter} this quarter`}
          subTextColor="text-green-600"
        />
        <GoalStatCard
          label="On Track"
          value={stats.onTrack}
          subText={`${Math.round((stats.onTrack / stats.total) * 100)}% of total`}
          borderColor="border-green-200"
          valueColor="text-green-600"
        />
        <GoalStatCard
          label="At Risk"
          value={stats.atRisk}
          subText={`${Math.round((stats.atRisk / stats.total) * 100)}% of total`}
          borderColor="border-yellow-200"
          valueColor="text-yellow-600"
        />
        <GoalStatCard
          label="Needs Attention"
          value={stats.needsAttention}
          subText={`${Math.round((stats.needsAttention / stats.total) * 100)}% of total`}
          borderColor="border-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter goals">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeFilter === tab.id}
            aria-controls="goals-list"
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeFilter === tab.id
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div
        id="goals-list"
        role="tabpanel"
        aria-label={filterTabs.find((t) => t.id === activeFilter)?.label}
        className="space-y-4"
      >
        {filteredGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        {filteredGoals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-gray-500">No goals found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics Tab Sub-components
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS = ['Q1 2026', 'Q4 2025', 'Q3 2025'] as const;

const iconMap: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign className="w-5 h-5 text-red-600" aria-hidden="true" />,
  Factory: <Factory className="w-5 h-5 text-red-600" aria-hidden="true" />,
  Users: <Users className="w-5 h-5 text-red-600" aria-hidden="true" />,
  Award: <Award className="w-5 h-5 text-red-600" aria-hidden="true" />,
};

function MetricCard({ metric }: { metric: KPIMetric }) {
  const changeColor =
    metric.changeDirection === 'up'
      ? 'text-green-600'
      : metric.changeDirection === 'down'
      ? 'text-red-600'
      : 'text-gray-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4" role="article" aria-label={`${metric.name} metric`}>
      <div className="text-xs text-gray-500 mb-2">{metric.name}</div>
      <div className="text-2xl text-gray-900 mb-2 tabular-nums">{metric.value}</div>
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-gray-500">Target: {metric.target}</span>
        <span className={changeColor}>{metric.change}</span>
      </div>
      {metric.unit && <div className="text-xs text-gray-500">{metric.unit}</div>}
    </div>
  );
}

function CategorySection({ category }: { category: KPICategory }) {
  const gridCols =
    category.columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="mb-8" aria-labelledby={`category-${category.id}`}>
      <div className="flex items-center gap-2 mb-4">
        {iconMap[category.icon]}
        <h4 id={`category-${category.id}`} className="text-sm text-gray-900 font-medium">
          {category.name}
        </h4>
      </div>
      <div className={`grid ${gridCols} gap-4`} role="list" aria-label={`${category.name} metrics`}>
        {category.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Metrics Tab
// ---------------------------------------------------------------------------

function MetricsTab() {
  const categories = defaultKPICategories;
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2026');

  return (
    <div>
      {/* KPI Performance Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-gray-900 font-semibold">KPI Performance Dashboard</h3>
          <div className="flex items-center gap-3">
            <label htmlFor="kpi-period-select" className="sr-only">Select period</label>
            <select
              id="kpi-period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Categories */}
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Goal Modal - Step Sub-components
// ---------------------------------------------------------------------------

const MODAL_STEPS = [
  { number: 1, label: 'Define Goal' },
  { number: 2, label: 'Set Targets' },
  { number: 3, label: 'Link & Finalize' },
] as const;

const MODAL_QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="px-8 pt-6">
      <div className="flex items-center gap-2">
        {MODAL_STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step.number <= currentStep ? 'bg-red-600' : 'bg-gray-100'
            }`}
            role="progressbar"
            aria-valuenow={step.number <= currentStep ? 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${step.number}: ${step.label}`}
          />
        ))}
      </div>
    </div>
  );
}

function ModalStep1({
  formData,
  onChange,
  suggestions,
  showSuggestions,
  onToggleSuggestions,
  onSelectSuggestion,
}: {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  suggestions: GoalSuggestion[];
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  onSelectSuggestion: (suggestion: GoalSuggestion) => void;
}) {
  return (
    <div className="space-y-6">
      {/* AI Assistance Banner */}
      <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="text-sm text-gray-900 mb-1">AI Goal Assistant</h4>
            <p className="text-xs text-gray-500 mb-3">
              Get smart suggestions based on your Scorecard metrics and annual plan
            </p>
            <button
              className="text-xs text-red-600 hover:text-red-500 transition-colors"
              onClick={onToggleSuggestions}
            >
              {showSuggestions ? 'Hide suggestions' : 'Show AI suggestions'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 mb-2 uppercase">
            Suggested Goals from Your Scorecard
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm text-gray-900 pr-4">{suggestion.title}</h4>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 whitespace-nowrap">
                  {suggestion.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{suggestion.reason}</p>
              <div className="flex items-center gap-1 text-xs text-red-600">
                <LinkIcon className="w-3 h-3" aria-hidden="true" />
                <span>{suggestion.scorecardLink}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Goal Statement */}
      <div>
        <label htmlFor="goal-statement" className="block text-xs text-gray-500 mb-2 uppercase">
          Goal Statement <span className="text-red-600">*</span>
        </label>
        <textarea
          id="goal-statement"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/50"
          rows={3}
          placeholder="e.g., Achieve 85% OEE across all manufacturing plants by end of Q2 2026"
          value={formData.statement}
          onChange={(e) => onChange('statement', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-2">
          Tip: Use specific, measurable language that clearly defines success
        </div>
      </div>

      {/* Goal Type & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-type" className="block text-xs text-gray-500 mb-2 uppercase">
            Goal Type <span className="text-red-600">*</span>
          </label>
          <select
            id="goal-type"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
            value={formData.type}
            onChange={(e) => onChange('type', e.target.value)}
          >
            <option value="">Select type...</option>
            {goalTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="goal-category" className="block text-xs text-gray-500 mb-2 uppercase">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            id="goal-category"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
            value={formData.category}
            onChange={(e) => onChange('category', e.target.value)}
          >
            <option value="">Select category...</option>
            {goalCategoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Goal Owner */}
      <div>
        <label htmlFor="goal-owner" className="block text-xs text-gray-500 mb-2 uppercase">
          Goal Owner <span className="text-red-600">*</span>
        </label>
        <select
          id="goal-owner"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.owner}
          onChange={(e) => onChange('owner', e.target.value)}
        >
          {goalOwnerOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-xs text-gray-500 mb-2 uppercase">
            Start Date <span className="text-red-600">*</span>
          </label>
          <input
            id="start-date"
            type="date"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
            value={formData.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="target-date" className="block text-xs text-gray-500 mb-2 uppercase">
            Target Date <span className="text-red-600">*</span>
          </label>
          <input
            id="target-date"
            type="date"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
            value={formData.targetDate}
            onChange={(e) => onChange('targetDate', e.target.value)}
          />
        </div>
      </div>

      {/* Active Quarters */}
      <div>
        <label className="block text-xs text-gray-500 mb-3 uppercase">
          Active Quarters <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-3" role="group" aria-label="Select active quarters">
          {MODAL_QUARTERS.map((quarter) => (
            <button
              key={quarter}
              type="button"
              className={`flex-1 px-4 py-3 bg-white border-2 rounded-lg text-sm text-gray-900 hover:border-red-600 transition-colors ${
                formData.activeQuarters.includes(quarter) ? 'border-red-600' : 'border-gray-200'
              }`}
              onClick={() => {
                const quarters = formData.activeQuarters.includes(quarter)
                  ? formData.activeQuarters.filter((q) => q !== quarter)
                  : [...formData.activeQuarters, quarter];
                onChange('activeQuarters', quarters);
              }}
              aria-pressed={formData.activeQuarters.includes(quarter)}
            >
              {quarter}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Select all quarters where this goal will be actively tracked
        </div>
      </div>
    </div>
  );
}

function ModalStep2({
  formData,
  onChange,
  onAddMilestone,
  onRemoveMilestone,
  onUpdateMilestone,
}: {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  onAddMilestone: () => void;
  onRemoveMilestone: (id: string) => void;
  onUpdateMilestone: (id: string, field: keyof Milestone, value: string) => void;
}) {
  const progressPercent =
    formData.currentValue && formData.targetValue
      ? Math.round(
          ((parseFloat(formData.currentValue) || 0) /
            (parseFloat(formData.targetValue) || 1)) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="text-sm text-gray-900 mb-1">Define Success Metrics</h4>
            <p className="text-xs text-gray-500">
              Set measurable targets so progress can be tracked automatically
            </p>
          </div>
        </div>
      </div>

      {/* Current State / Baseline */}
      <div>
        <label className="block text-xs text-gray-500 mb-2 uppercase">
          Current State / Baseline <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              placeholder="e.g., 82.3"
              value={formData.currentValue}
              onChange={(e) => onChange('currentValue', e.target.value)}
              aria-label="Current value"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              placeholder="Unit (e.g., %)"
              value={formData.currentUnit}
              onChange={(e) => onChange('currentUnit', e.target.value)}
              aria-label="Current value unit"
            />
          </div>
        </div>
      </div>

      {/* Target State / Goal */}
      <div>
        <label className="block text-xs text-gray-500 mb-2 uppercase">
          Target State / Goal <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              placeholder="e.g., 85"
              value={formData.targetValue}
              onChange={(e) => onChange('targetValue', e.target.value)}
              aria-label="Target value"
            />
          </div>
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              placeholder="Unit (e.g., %)"
              value={formData.targetUnit}
              onChange={(e) => onChange('targetUnit', e.target.value)}
              aria-label="Target value unit"
            />
          </div>
        </div>
      </div>

      {/* Progress Calculation Preview */}
      {formData.currentValue && formData.targetValue && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm text-gray-900 mb-1">Progress Preview</h4>
              <p className="text-xs text-gray-500 mb-3">
                Based on your baseline and target, here&apos;s how progress will be calculated
              </p>
              <div className="bg-white border border-green-200 rounded p-3">
                <div className="text-xs text-gray-500 mb-2">Current Progress</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl text-gray-900 tabular-nums">{progressPercent}%</div>
                  <div className="text-xs text-gray-500">
                    {formData.currentValue}{formData.currentUnit} &rarr; {formData.targetValue}{formData.targetUnit}
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress preview: ${progressPercent}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Frequency */}
      <div>
        <label htmlFor="measurement-frequency" className="block text-xs text-gray-500 mb-2 uppercase">
          Measurement Frequency <span className="text-red-600">*</span>
        </label>
        <select
          id="measurement-frequency"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.measurementFrequency}
          onChange={(e) => onChange('measurementFrequency', e.target.value)}
        >
          {measurementFrequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-2">
          How often will you update progress on this goal?
        </div>
      </div>

      {/* Key Milestones */}
      <div>
        <label className="block text-xs text-gray-500 mb-2 uppercase">
          Key Milestones (Optional)
        </label>
        <div className="space-y-3">
          {formData.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                value={milestone.title}
                onChange={(e) => onUpdateMilestone(milestone.id, 'title', e.target.value)}
                placeholder="Milestone description"
                aria-label="Milestone description"
              />
              <input
                type="date"
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                value={milestone.dueDate}
                onChange={(e) => onUpdateMilestone(milestone.id, 'dueDate', e.target.value)}
                aria-label="Milestone due date"
              />
              <button
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                onClick={() => onRemoveMilestone(milestone.id)}
                aria-label="Remove milestone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            className="text-xs text-red-600 hover:text-red-500 transition-colors"
            onClick={onAddMilestone}
          >
            + Add milestone
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalStep3({
  formData,
  onChange,
  scorecardOptions,
}: {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  scorecardOptions: ScorecardOption[];
}) {
  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="text-sm text-gray-900 mb-1">Connect to Strategic Framework</h4>
            <p className="text-xs text-gray-500">
              Link this goal to your Scorecard, Annual Plan, or Leadership Program for visibility
            </p>
          </div>
        </div>
      </div>

      {/* Link to Scorecard */}
      <div>
        <label className="block text-xs text-gray-500 mb-3 uppercase">
          Link to Scorecard (Recommended)
        </label>
        <div className="space-y-2" role="radiogroup" aria-label="Scorecard options">
          {scorecardOptions.map((option) => {
            const statusCfg: Record<ProgressStatus, { text: string; label: string }> = {
              'on-track': { text: 'text-green-600', label: 'On Track' },
              'at-risk': { text: 'text-yellow-600', label: 'At Risk' },
              'needs-attention': { text: 'text-red-600', label: 'Needs Attention' },
            };
            const cfg = statusCfg[option.status];

            return (
              <button
                key={option.id}
                type="button"
                className={`w-full text-left bg-white border rounded-lg p-4 hover:border-red-600 transition-colors ${
                  formData.scorecardLink === option.id ? 'border-red-600' : 'border-gray-200'
                }`}
                onClick={() => onChange('scorecardLink', option.id)}
                role="radio"
                aria-checked={formData.scorecardLink === option.id}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg text-gray-900 mb-1 tabular-nums">{option.score}</div>
                    <div className={`text-xs ${cfg.text}`}>{cfg.label}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link to Annual Plan */}
      <div>
        <label htmlFor="annual-plan-link" className="block text-xs text-gray-500 mb-3 uppercase">
          Link to Annual Plan (Optional)
        </label>
        <select
          id="annual-plan-link"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.annualPlanLink}
          onChange={(e) => onChange('annualPlanLink', e.target.value)}
        >
          {annualPlanLinkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Link to Program */}
      <div>
        <label htmlFor="program-link" className="block text-xs text-gray-500 mb-3 uppercase">
          Link to Leadership Program (Optional)
        </label>
        <select
          id="program-link"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.programLink}
          onChange={(e) => onChange('programLink', e.target.value)}
        >
          {programLinkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Visibility & Collaboration */}
      <div>
        <label className="block text-xs text-gray-500 mb-3 uppercase">
          Visibility & Collaboration
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-gray-200 text-red-600 focus:ring-red-600"
              checked={formData.visibleToReports}
              onChange={(e) => onChange('visibleToReports', e.target.checked)}
            />
            <div>
              <div className="text-sm text-gray-900 mb-1">Visible to direct reports</div>
              <div className="text-xs text-gray-500">
                Your leadership team can see and contribute to this goal
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-gray-200 text-red-600 focus:ring-red-600"
              checked={formData.addToDashboard}
              onChange={(e) => onChange('addToDashboard', e.target.checked)}
            />
            <div>
              <div className="text-sm text-gray-900 mb-1">Add to Dashboard</div>
              <div className="text-xs text-gray-500">
                Show this goal in your Journey Hub for quick access
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-gray-200 text-red-600 focus:ring-red-600"
              checked={formData.enableAIMentoring}
              onChange={(e) => onChange('enableAIMentoring', e.target.checked)}
            />
            <div>
              <div className="text-sm text-gray-900 mb-1">Enable AI mentoring suggestions</div>
              <div className="text-xs text-gray-500">
                Receive weekly insights and recommendations to stay on track
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Accountability Partner */}
      <div>
        <label htmlFor="accountability-partner" className="block text-xs text-gray-500 mb-3 uppercase">
          Accountability Partner (Optional)
        </label>
        <select
          id="accountability-partner"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.accountabilityPartner}
          onChange={(e) => onChange('accountabilityPartner', e.target.value)}
        >
          {accountabilityPartnerOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-2">
          This person will receive progress updates and can provide guidance
        </div>
      </div>

      {/* Goal Summary */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-5">
        <h4 className="text-sm text-gray-900 mb-3">Goal Summary</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Goal:</span>
            <span className="text-gray-900 text-right max-w-[300px] truncate">
              {formData.statement || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Owner:</span>
            <span className="text-gray-900">
              {goalOwnerOptions.find((o) => o.value === formData.owner)?.label || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Timeline:</span>
            <span className="text-gray-900">
              {formData.activeQuarters.length > 0
                ? formData.activeQuarters.sort().join(', ')
                : 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Target:</span>
            <span className="text-gray-900">
              {formData.currentValue && formData.targetValue
                ? `${formData.currentValue}${formData.currentUnit} \u2192 ${formData.targetValue}${formData.targetUnit}`
                : 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Linked to:</span>
            <span className="text-gray-900">
              {formData.scorecardLink
                ? `Scorecard: ${defaultScorecardOptions.find((o) => o.id === formData.scorecardLink)?.name}`
                : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Goal Modal
// ---------------------------------------------------------------------------

function NewGoalModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const suggestions = defaultGoalSuggestions;
  const scorecardOptions = defaultScorecardOptions;

  const [currentStep, setCurrentStep] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    statement: '',
    type: '',
    category: '',
    owner: 'you',
    startDate: '2026-01-14',
    targetDate: '',
    activeQuarters: [],
    currentValue: '',
    currentUnit: '',
    targetValue: '',
    targetUnit: '',
    measurementFrequency: 'weekly',
    milestones: [],
    scorecardLink: '',
    annualPlanLink: 'none',
    programLink: 'none',
    visibleToReports: true,
    addToDashboard: false,
    enableAIMentoring: true,
    accountabilityPartner: 'none',
  });

  const handleChange = useCallback((field: keyof GoalFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: GoalSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      statement: suggestion.title,
      category: suggestion.category.toLowerCase(),
    }));
    setShowSuggestions(false);
  }, []);

  const handleAddMilestone = useCallback(() => {
    const newMilestone: Milestone = { id: `milestone-${Date.now()}`, title: '', dueDate: '' };
    setFormData((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
  }, []);

  const handleRemoveMilestone = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }));
  }, []);

  const handleUpdateMilestone = useCallback((id: string, field: keyof Milestone, value: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleContinue = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create goal action
      onClose();
    }
  }, [currentStep, onClose]);

  const handleSaveDraft = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white border border-gray-200 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div>
            <h2 id="modal-title" className="text-gray-900 font-semibold mb-1">
              Create New Goal
            </h2>
            <p className="text-sm text-gray-500">
              Step {currentStep} of 3 &bull; {MODAL_STEPS[currentStep - 1].label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 && (
            <ModalStep1
              formData={formData}
              onChange={handleChange}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
              onSelectSuggestion={handleSelectSuggestion}
            />
          )}
          {currentStep === 2 && (
            <ModalStep2
              formData={formData}
              onChange={handleChange}
              onAddMilestone={handleAddMilestone}
              onRemoveMilestone={handleRemoveMilestone}
              onUpdateMilestone={handleUpdateMilestone}
            />
          )}
          {currentStep === 3 && (
            <ModalStep3
              formData={formData}
              onChange={handleChange}
              scorecardOptions={scorecardOptions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-200 bg-gray-50">
          <button
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            {currentStep < 3 && (
              <button
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                onClick={handleSaveDraft}
              >
                Save as Draft
              </button>
            )}
            <button
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              onClick={handleContinue}
            >
              {currentStep === 3 ? 'Create Goal' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

type TabId = 'annual' | 'quarterly' | 'goals' | 'metrics';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'annual', label: 'Annual Planning', icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
  { id: 'quarterly', label: 'Quarterly Planning', icon: <Target className="w-4 h-4" aria-hidden="true" /> },
  { id: 'goals', label: 'Goals', icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> },
  { id: 'metrics', label: 'Metrics & KPIs', icon: <TrendingUp className="w-4 h-4" aria-hidden="true" /> },
];

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PlanningGoalsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('annual');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'annual':
        return <AnnualPlanningTab />;
      case 'quarterly':
        return <QuarterlyPlanningTab />;
      case 'goals':
        return <GoalsTab />;
      case 'metrics':
        return <MetricsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Planning & Goals
            </h1>
            <p className="text-gray-500">
              Strategic planning, quarterly execution, and goal tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2">
              <Filter className="w-4 h-4 inline mr-2" aria-hidden="true" />
              Filter
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
              New Goal
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="mb-8 border-b border-gray-200 overflow-x-auto" aria-label="Planning sections">
        <div className="flex gap-6" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
