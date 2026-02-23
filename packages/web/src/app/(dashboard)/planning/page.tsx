'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateStrategicPlan,
  usePlanningSummary,
  useStrategicPlans,
  type PlanningGoal,
  type GoalCategory,
  type GoalStatus,
  type GoalPriority,
  type StrategicPlan,
  type PlanType,
  type PlanStatus,
} from '@/hooks/api/usePlanning';
import {
  useScorecard,
  useScorecardPeriods,
  type MetricCategory,
  type ScorecardMetric,
} from '@/hooks/api/useScorecard';
import { useTenants } from '@/hooks/api/useTenants';
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
  X,
  Sparkles,
  Link as LinkIcon,
  DollarSign,
  Factory,
  Award,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProgressStatus = 'on-track' | 'at-risk' | 'needs-attention';
type GoalType = 'company' | 'team' | 'personal';

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
// Goal Modal Static Options
// ---------------------------------------------------------------------------

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

const goalStatusConfig: Record<
  ProgressStatus,
  { border: string; progressBg: string; text: string; label: string }
> = {
  'on-track': {
    border: 'border-gray-200',
    progressBg: 'bg-green-500',
    text: 'text-green-600',
    label: 'On Track',
  },
  'at-risk': {
    border: 'border-yellow-200',
    progressBg: 'bg-yellow-500',
    text: 'text-yellow-600',
    label: 'At Risk',
  },
  'needs-attention': {
    border: 'border-red-300',
    progressBg: 'bg-red-600',
    text: 'text-red-600',
    label: 'Needs Attention',
  },
};

// ---------------------------------------------------------------------------
// Annual Planning Tab
// ---------------------------------------------------------------------------

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  bhag: 'BHAG',
  '3hag': '3HAG',
  annual: 'Annual',
  quarterly: 'Quarterly',
};

const PLAN_STATUS_STYLES: Record<PlanStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Active' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Completed' },
  archived: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Archived' },
};

function StrategicPlanCard({ plan }: { plan: StrategicPlan }) {
  const typeLabel = PLAN_TYPE_LABELS[plan.planType];
  const statusStyle = PLAN_STATUS_STYLES[plan.status];
  const targetYear = plan.targetDate ? new Date(plan.targetDate).getFullYear() : null;
  const metrics = (
    plan.config as { metrics?: { name: string; target: string; current?: string }[] }
  )?.metrics;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" role="article">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded font-medium">
            {typeLabel}
          </span>
          {targetYear && <span className="text-xs text-gray-400">{targetYear}</span>}
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>
      <h4 className="text-gray-900 font-medium mb-2">{plan.name}</h4>
      {plan.description && (
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{plan.description}</p>
      )}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          {metrics.slice(0, 3).map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-400 mb-1">{m.name}</div>
              <div className="text-sm font-medium text-gray-900">{m.current ?? '—'}</div>
              <div className="text-xs text-gray-400">/ {m.target}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnualPlanningTab({ tenantId }: { tenantId: string | null }) {
  const { user } = useAuth();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const { data: plansData, isLoading } = useStrategicPlans(tenantId);

  const allPlans = plansData?.data ?? [];
  const visionPlans = allPlans.filter((p) => p.planType === 'bhag' || p.planType === '3hag');
  const annualPlans = allPlans.filter((p) => p.planType === 'annual');
  const hasAny = allPlans.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading strategic plans…</p>
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
        <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-gray-900 font-medium mb-2">No strategic plans yet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create your 3HAG, BHAG, or Annual plan to start tracking strategic direction.
        </p>
        {(user?.roleLevel ?? 0) >= 70 && (
          <button
            onClick={() => setShowCreatePlan(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
            Create Strategic Plan
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Vision / Long-term Plans */}
      {visionPlans.length > 0 && (
        <section className="mb-8" aria-labelledby="vision-heading">
          <h3 id="vision-heading" className="text-gray-900 font-semibold mb-4">
            Long-Term Vision
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {visionPlans.map((plan) => (
              <StrategicPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Annual Plans */}
      {annualPlans.length > 0 && (
        <section aria-labelledby="annual-heading">
          <h3 id="annual-heading" className="text-gray-900 font-semibold mb-4">
            Annual Plans
          </h3>
          <div className="space-y-4" role="list">
            {annualPlans.map((plan) => (
              <StrategicPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Create Strategic Plan button (visible when plans exist) */}
      {hasAny && (user?.roleLevel ?? 0) >= 70 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCreatePlan(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
            Create Strategic Plan
          </button>
        </div>
      )}

      {showCreatePlan && (
        <NewStrategicPlanModal
          tenantId={tenantId}
          defaultPlanType="annual"
          onClose={() => setShowCreatePlan(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quarterly Planning Tab
// ---------------------------------------------------------------------------

function QuarterlyPlanningTab({ tenantId }: { tenantId: string | null }) {
  const { user } = useAuth();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const { data: plansData, isLoading } = useStrategicPlans(tenantId, { planType: 'quarterly' });

  const plans = plansData?.data ?? [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading quarterly plans…</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
        <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-gray-900 font-medium mb-2">No quarterly plans yet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Break your annual plan into quarterly OKRs and priorities.
        </p>
        {(user?.roleLevel ?? 0) >= 70 && (
          <button
            onClick={() => setShowCreatePlan(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
            Create Quarterly Plan
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <section aria-labelledby="quarterly-heading">
        <h3 id="quarterly-heading" className="text-gray-900 font-semibold mb-4">
          Quarterly Plans
        </h3>
        <div className="space-y-4" role="list">
          {plans.map((plan) => {
            const config = plan.config as { okrFormat?: boolean; keyResults?: string[] } | null;
            const keyResults = config?.keyResults ?? [];
            const statusStyle = PLAN_STATUS_STYLES[plan.status];
            const startDisplay = plan.startDate
              ? new Date(plan.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const endDisplay = plan.targetDate
              ? new Date(plan.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
                role="article"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                    {(startDisplay || endDisplay) && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {startDisplay} — {endDisplay}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                )}
                {keyResults.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2 uppercase">Key Results</div>
                    <ul className="space-y-1">
                      {keyResults.map((kr, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <ChevronRight
                            className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          {kr}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Create Quarterly Plan button (visible when plans exist) */}
      {plans.length > 0 && (user?.roleLevel ?? 0) >= 70 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCreatePlan(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" aria-hidden="true" />
            Create Quarterly Plan
          </button>
        </div>
      )}

      {showCreatePlan && (
        <NewStrategicPlanModal
          tenantId={tenantId}
          defaultPlanType="quarterly"
          onClose={() => setShowCreatePlan(false)}
        />
      )}
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

function GoalCard({
  goal,
  onUpdateProgress,
  onOpenDetail,
}: {
  goal: Goal;
  onUpdateProgress?: (goalId: string, progress: number) => void;
  onOpenDetail?: (goalId: string) => void;
}) {
  const config = goalStatusConfig[goal.status];
  const typeLabels: Record<GoalType, string> = {
    company: 'Company',
    team: 'Team',
    personal: 'Personal',
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState(String(goal.progress));

  const handleProgressSubmit = () => {
    const val = Math.min(100, Math.max(0, Number(editProgress) || 0));
    onUpdateProgress?.(goal.id, val);
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${config.border} hover:border-red-300 transition-colors p-5`}
      role="article"
      aria-label={goal.title}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {onOpenDetail ? (
              <button
                onClick={() => onOpenDetail(goal.id)}
                className="text-sm text-gray-900 font-medium hover:text-red-600 transition-colors text-left"
              >
                {goal.title}
              </button>
            ) : (
              <h4 className="text-sm text-gray-900">{goal.title}</h4>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="px-2 py-1 bg-gray-100 rounded">{typeLabels[goal.type]}</span>
            <span className="px-2 py-1 bg-gray-100 rounded">{goal.category}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" />
              {goal.ownerRole ? `${goal.ownerRole} - ` : ''}
              {goal.owner}
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
        <div className="sm:ml-6 text-right shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                value={editProgress}
                onChange={(e) => setEditProgress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProgressSubmit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                onBlur={handleProgressSubmit}
                autoFocus
                aria-label="Edit progress percentage"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-end">
              <div>
                <div className="text-2xl text-gray-900 mb-1 tabular-nums">{goal.progress}%</div>
                <div className={`text-xs ${config.text} mb-2`}>{config.label}</div>
                <div className="text-xs text-gray-500">
                  {goal.currentValue} / {goal.targetValue}
                </div>
              </div>
              {onUpdateProgress && (
                <button
                  onClick={() => {
                    setEditProgress(String(goal.progress));
                    setIsEditing(true);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Edit progress"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
// Goal Edit Modal
// ---------------------------------------------------------------------------

function GoalEditModal({
  goal,
  tenantId,
  onClose,
}: {
  goal: PlanningGoal;
  tenantId: string | null;
  onClose: () => void;
}) {
  const updateGoal = useUpdateGoal(tenantId);
  const deleteGoal = useDeleteGoal(tenantId);

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? '');
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [category, setCategory] = useState<GoalCategory>(goal.category);
  const [priority, setPriority] = useState<GoalPriority>(goal.priority);
  const [startDate, setStartDate] = useState(goal.startDate?.split('T')[0] ?? '');
  const [targetDate, setTargetDate] = useState(goal.targetDate?.split('T')[0] ?? '');
  const [progress, setProgress] = useState(String(goal.progress));
  const [successMetrics, setSuccessMetrics] = useState(goal.successMetrics ?? '');
  const [actionStepInput, setActionStepInput] = useState('');
  const [actionSteps, setActionSteps] = useState<string[]>(goal.actionSteps ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSaving = updateGoal.isPending;
  const isDeleting = deleteGoal.isPending;

  function addStep() {
    const trimmed = actionStepInput.trim();
    if (trimmed && !actionSteps.includes(trimmed)) {
      setActionSteps([...actionSteps, trimmed]);
    }
    setActionStepInput('');
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError(null);
    try {
      await updateGoal.mutateAsync({
        goalId: goal.id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          category,
          priority,
          startDate: startDate || undefined,
          targetDate: targetDate || undefined,
          progress: Math.min(100, Math.max(0, Number(progress) || 0)),
          successMetrics: successMetrics.trim() || undefined,
          actionSteps,
        },
      });
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    }
  }

  async function handleDelete() {
    try {
      await deleteGoal.mutateAsync(goal.id);
      onClose();
    } catch {
      setError('Failed to delete. Please try again.');
    }
  }

  const inputCls =
    'w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30';
  const labelCls = 'text-sm font-medium text-sidebar-foreground block mb-1.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-semibold text-sidebar-foreground">Edit Goal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelCls}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Goal title"
            />
          </div>

          {/* Status / Category / Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className={inputCls}
              >
                <option value="professional">Professional</option>
                <option value="personal">Personal</option>
                <option value="leadership">Leadership</option>
                <option value="strategic">Strategic</option>
                <option value="performance">Performance</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className={inputCls}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Progress / Start Date / Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Progress (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Describe this goal..."
            />
          </div>

          {/* Success Metrics */}
          <div>
            <label className={labelCls}>Success Metrics</label>
            <textarea
              value={successMetrics}
              onChange={(e) => setSuccessMetrics(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="How will you measure success?"
            />
          </div>

          {/* Action Steps */}
          <div>
            <label className={labelCls}>Action Steps</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {actionSteps.map((step) => (
                <span
                  key={step}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-accent rounded-lg text-xs"
                >
                  {step}
                  <button
                    onClick={() => setActionSteps(actionSteps.filter((s) => s !== step))}
                    className="hover:text-red-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {actionSteps.length === 0 && (
                <span className="text-xs text-muted-foreground italic">No steps added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={actionStepInput}
                onChange={(e) => setActionStepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStep();
                  }
                }}
                placeholder="Type a step and press Enter"
                className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                onClick={addStep}
                className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-700">Delete this goal?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goals Tab
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'my' | 'team' | 'company';

function GoalsTab({ tenantId }: { tenantId: string | null }) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const updateGoal = useUpdateGoal(tenantId);

  const handleUpdateProgress = useCallback(
    async (goalId: string, progress: number) => {
      try {
        await updateGoal.mutateAsync({ goalId, data: { progress } });
      } catch {
        // silently handle
      }
    },
    [updateGoal]
  );

  const categoryForFilter: Record<FilterTab, GoalCategory | undefined> = {
    all: undefined,
    my: undefined,
    team: 'leadership',
    company: 'strategic',
  };

  const { data: goalsData, isLoading: goalsLoading } = useGoals(tenantId, {
    userId: activeFilter === 'my' ? (user?.id ?? undefined) : undefined,
    category: categoryForFilter[activeFilter],
  });

  const { data: summary } = usePlanningSummary(tenantId);

  const apiGoals = goalsData?.data ?? [];
  const summaryGoals = summary?.goals;

  // Map API goals to display format
  const displayGoals: Goal[] = apiGoals.map((g: PlanningGoal) => {
    const statusMap: Record<string, ProgressStatus> = {
      active: 'on-track',
      on_hold: 'at-risk',
      draft: 'needs-attention',
      completed: 'on-track',
      cancelled: 'needs-attention',
    };
    return {
      id: g.id,
      title: g.title,
      type: 'personal' as GoalType,
      category: g.category.charAt(0).toUpperCase() + g.category.slice(1),
      owner: g.ownerName ?? 'Unknown',
      ownerRole: '',
      dueDate: g.targetDate
        ? new Date(g.targetDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'No due date',
      progress: g.progress,
      currentValue: `${g.progress}%`,
      targetValue: '100%',
      status: statusMap[g.status] ?? 'needs-attention',
    };
  });

  const totalGoals = goalsData?.meta.total ?? summaryGoals?.total ?? 0;
  const activeGoals = summaryGoals?.active ?? 0;
  const completedGoals = summaryGoals?.completed ?? 0;
  const draftGoals = summaryGoals?.draft ?? 0;

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Goals', count: totalGoals },
    { id: 'my', label: 'My Goals', count: totalGoals },
    { id: 'team', label: 'Team Goals', count: totalGoals },
    { id: 'company', label: 'Company Goals', count: totalGoals },
  ];

  return (
    <div>
      {/* Goals Summary Stats */}
      <div
        className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="Goals summary statistics"
      >
        <GoalStatCard
          label="Total Goals"
          value={totalGoals}
          subText={`${activeGoals} active`}
          subTextColor="text-green-600"
        />
        <GoalStatCard
          label="Active"
          value={activeGoals}
          subText={
            totalGoals > 0
              ? `${Math.round((activeGoals / totalGoals) * 100)}% of total`
              : '0% of total'
          }
          borderColor="border-green-200"
          valueColor="text-green-600"
        />
        <GoalStatCard
          label="Completed"
          value={completedGoals}
          subText={
            totalGoals > 0
              ? `${Math.round((completedGoals / totalGoals) * 100)}% of total`
              : '0% of total'
          }
          borderColor="border-yellow-200"
          valueColor="text-yellow-600"
        />
        <GoalStatCard
          label="Draft / On Hold"
          value={draftGoals + (summaryGoals?.onHold ?? 0)}
          subText="needs attention"
          borderColor="border-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* Filter Tabs */}
      <div
        className="mb-6 flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter goals"
      >
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
            {tab.label}
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
        {goalsLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Loading goals...</p>
          </div>
        )}
        {!goalsLoading &&
          displayGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdateProgress={handleUpdateProgress}
              onOpenDetail={(id) => setEditGoalId(id)}
            />
          ))}
        {!goalsLoading && displayGoals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-2">No goals yet.</p>
            <p className="text-sm text-gray-400">
              Click &quot;New Goal&quot; to create your first goal.
            </p>
          </div>
        )}
      </div>

      {/* Goal Edit Modal */}
      {editGoalId &&
        (() => {
          const planningGoal = apiGoals.find((g) => g.id === editGoalId);
          return planningGoal ? (
            <GoalEditModal
              goal={planningGoal}
              tenantId={tenantId}
              onClose={() => setEditGoalId(null)}
            />
          ) : null;
        })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics Tab Sub-components
// ---------------------------------------------------------------------------

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
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      role="article"
      aria-label={`${metric.name} metric`}
    >
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

/** Map category name to icon key for CategorySection */
function categoryToIcon(name: string): string {
  const lc = name.toLowerCase();
  if (
    lc.includes('financial') ||
    lc.includes('finance') ||
    lc.includes('revenue') ||
    lc.includes('profit')
  )
    return 'DollarSign';
  if (
    lc.includes('operational') ||
    lc.includes('delivery') ||
    lc.includes('engineering') ||
    lc.includes('product')
  )
    return 'Factory';
  if (
    lc.includes('people') ||
    lc.includes('culture') ||
    lc.includes('team') ||
    lc.includes('talent')
  )
    return 'Users';
  return 'Award';
}

/** Map a MetricCategory from the scorecard API to the KPICategory shape used by CategorySection */
function mapMetricCategory(cat: MetricCategory, idx: number): KPICategory {
  return {
    id: `cat-${idx}`,
    name: cat.category,
    icon: categoryToIcon(cat.category),
    columns: cat.metrics.length >= 4 ? 4 : 3,
    metrics: cat.metrics.map((m: ScorecardMetric) => {
      // invertTrend=1 means "down is good" — flip the colour direction for the UI
      const raw: 'up' | 'down' | 'neutral' = m.trend;
      const changeDirection: 'up' | 'down' | 'neutral' = m.invertTrend
        ? raw === 'up'
          ? 'down'
          : raw === 'down'
            ? 'up'
            : 'neutral'
        : raw;
      return {
        id: m.id,
        name: m.name,
        value: m.actualValue || '—',
        target: m.targetValue || '—',
        change: m.changeLabel ?? '',
        changeDirection,
        unit: m.period || undefined,
      };
    }),
  };
}

function MetricsTab({ tenantId }: { tenantId: string | null }) {
  // Load available periods; fall back to static list while loading
  const { data: periodsData } = useScorecardPeriods(tenantId);
  const availablePeriods =
    periodsData && periodsData.length > 0 ? periodsData : ['Q1-2026', 'Q4-2025', 'Q3-2025'];

  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  // Once periods load, select the first (most recent) if none selected
  const activePeriod = selectedPeriod || availablePeriods[0];

  const { data: scorecard, isLoading } = useScorecard(tenantId, activePeriod);

  const categories: KPICategory[] = scorecard?.metricCategories
    ? scorecard.metricCategories
        .filter((cat) => cat.metrics.length > 0)
        .map((cat, idx) => mapMetricCategory(cat, idx))
    : [];

  // Human-readable: "Q1-2026" → "Q1 2026"
  const displayPeriod = (p: string) => p.replace('-', ' ');

  return (
    <div>
      {/* KPI Performance Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-gray-900 font-semibold">KPI Performance Dashboard</h3>
          <div className="flex items-center gap-3">
            <label htmlFor="kpi-period-select" className="sr-only">
              Select period
            </label>
            <select
              id="kpi-period-select"
              value={activePeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            >
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {displayPeriod(period)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Loading metrics…</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-gray-900 font-medium mb-2">No KPI data for this period</h3>
          <p className="text-sm text-gray-500">
            Metrics will appear here once scorecard items are set up for{' '}
            {displayPeriod(activePeriod)}.
          </p>
        </div>
      )}

      {/* KPI Categories */}
      {!isLoading &&
        categories.map((category) => <CategorySection key={category.id} category={category} />)}
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
          ((parseFloat(formData.currentValue) || 0) / (parseFloat(formData.targetValue) || 1)) * 100
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
            <TrendingUp
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
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
                    {formData.currentValue}
                    {formData.currentUnit} &rarr; {formData.targetValue}
                    {formData.targetUnit}
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
        <label
          htmlFor="measurement-frequency"
          className="block text-xs text-gray-500 mb-2 uppercase"
        >
          Measurement Frequency <span className="text-red-600">*</span>
        </label>
        <select
          id="measurement-frequency"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.measurementFrequency}
          onChange={(e) => onChange('measurementFrequency', e.target.value)}
        >
          {measurementFrequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
  annualPlanOptions,
}: {
  formData: GoalFormData;
  onChange: (field: keyof GoalFormData, value: unknown) => void;
  scorecardOptions: ScorecardOption[];
  annualPlanOptions: { value: string; label: string }[];
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
          {annualPlanOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
        <label
          htmlFor="accountability-partner"
          className="block text-xs text-gray-500 mb-3 uppercase"
        >
          Accountability Partner (Optional)
        </label>
        <select
          id="accountability-partner"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          value={formData.accountabilityPartner}
          onChange={(e) => onChange('accountabilityPartner', e.target.value)}
        >
          {accountabilityPartnerOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
                ? `Scorecard: ${scorecardOptions.find((o) => o.id === formData.scorecardLink)?.name ?? formData.scorecardLink}`
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
  tenantId,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | null;
}) {
  const suggestions = defaultGoalSuggestions;
  const createGoal = useCreateGoal(tenantId);
  const { data: scorecardData } = useScorecard(tenantId);
  const { data: annualPlansData } = useStrategicPlans(tenantId);

  const scorecardOptions: ScorecardOption[] = (scorecardData?.items ?? []).map((item) => {
    const statusMap: Record<string, ProgressStatus> = {
      on_track: 'on-track',
      at_risk: 'at-risk',
      needs_attention: 'needs-attention',
    };
    return {
      id: item.id,
      name: item.title,
      description: item.description ?? '',
      score: item.score,
      status: (statusMap[item.status] ?? 'on-track') as ProgressStatus,
    };
  });

  const annualPlanOptions: { value: string; label: string }[] = [
    { value: 'none', label: 'No link' },
    ...(annualPlansData?.data ?? [])
      .filter((p) => p.planType === 'annual' || p.planType === 'bhag' || p.planType === '3hag')
      .map((p) => ({ value: p.id, label: p.name })),
  ];

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

  const handleContinue = useCallback(async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create goal via API
      if (!formData.statement.trim()) return;
      const validCategories = [
        'professional',
        'personal',
        'leadership',
        'strategic',
        'performance',
        'development',
      ];
      const category = validCategories.includes(formData.category)
        ? (formData.category as GoalCategory)
        : 'professional';
      const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
        company: 'high',
        team: 'medium',
        personal: 'low',
      };
      try {
        await createGoal.mutateAsync({
          title: formData.statement,
          description: formData.statement,
          category,
          priority: priorityMap[formData.type] ?? 'medium',
          targetDate: formData.targetDate || undefined,
          startDate: formData.startDate || undefined,
          reviewFrequency: formData.measurementFrequency || 'monthly',
          successMetrics: formData.targetValue
            ? `${formData.currentValue}${formData.currentUnit} → ${formData.targetValue}${formData.targetUnit}`
            : undefined,
          strategicPlanId:
            formData.annualPlanLink && formData.annualPlanLink !== 'none'
              ? formData.annualPlanLink
              : undefined,
        });
        onClose();
        setCurrentStep(1);
        setFormData((prev) => ({ ...prev, statement: '', category: '', targetDate: '' }));
      } catch {
        // error handled by mutation
      }
    }
  }, [currentStep, formData, createGoal, onClose]);

  const handleSaveDraft = useCallback(async () => {
    if (formData.statement.trim()) {
      const validCategories = [
        'professional',
        'personal',
        'leadership',
        'strategic',
        'performance',
        'development',
      ];
      const category = validCategories.includes(formData.category)
        ? (formData.category as GoalCategory)
        : 'professional';
      try {
        await createGoal.mutateAsync({ title: formData.statement, category });
      } catch {
        // error handled silently for draft save
      }
    }
    onClose();
  }, [formData, createGoal, onClose]);

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
              annualPlanOptions={annualPlanOptions}
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
// New Strategic Plan Modal
// ---------------------------------------------------------------------------

function NewStrategicPlanModal({
  tenantId,
  defaultPlanType,
  onClose,
}: {
  tenantId: string | null;
  defaultPlanType: PlanType;
  onClose: () => void;
}) {
  const createPlan = useCreateStrategicPlan(tenantId);
  const [formData, setFormData] = useState({
    name: '',
    planType: defaultPlanType,
    description: '',
    startDate: '',
    targetDate: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await createPlan.mutateAsync({
        name: formData.name.trim(),
        planType: formData.planType as PlanType,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        targetDate: formData.targetDate || undefined,
      });
      onClose();
    } catch {
      setError('Failed to create plan. Please try again.');
    }
  };

  const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
    { value: 'annual', label: 'Annual Plan' },
    { value: 'quarterly', label: 'Quarterly Plan' },
    { value: '3hag', label: '3HAG (3-Year Highly Achievable Goal)' },
    { value: 'bhag', label: 'BHAG (Big Hairy Audacious Goal)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white border border-gray-200 rounded-lg shadow-2xl w-full max-w-lg mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 id="plan-modal-title" className="text-gray-900 font-semibold">
            Create Strategic Plan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="plan-name" className="block text-xs text-gray-500 mb-2 uppercase">
              Plan Name <span className="text-red-600">*</span>
            </label>
            <input
              id="plan-name"
              type="text"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              placeholder="e.g., 2026 Annual Operating Plan"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="plan-type" className="block text-xs text-gray-500 mb-2 uppercase">
              Plan Type <span className="text-red-600">*</span>
            </label>
            <select
              id="plan-type"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
              value={formData.planType}
              onChange={(e) => setFormData((p) => ({ ...p, planType: e.target.value as PlanType }))}
            >
              {PLAN_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="plan-description"
              className="block text-xs text-gray-500 mb-2 uppercase"
            >
              Description (Optional)
            </label>
            <textarea
              id="plan-description"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-600/50"
              rows={2}
              placeholder="Brief description of this plan's objectives…"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plan-start" className="block text-xs text-gray-500 mb-2 uppercase">
                Start Date
              </label>
              <input
                id="plan-start"
                type="date"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                value={formData.startDate}
                onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="plan-target" className="block text-xs text-gray-500 mb-2 uppercase">
                Target Date
              </label>
              <input
                id="plan-target"
                type="date"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600/50"
                value={formData.targetDate}
                onChange={(e) => setFormData((p) => ({ ...p, targetDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createPlan.isPending}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            {createPlan.isPending ? 'Creating…' : 'Create Plan'}
          </button>
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
  {
    id: 'annual',
    label: 'Annual Planning',
    icon: <Calendar className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'quarterly',
    label: 'Quarterly Planning',
    icon: <Target className="w-4 h-4" aria-hidden="true" />,
  },
  { id: 'goals', label: 'Goals', icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> },
  {
    id: 'metrics',
    label: 'Metrics & KPIs',
    icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
  },
];

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PlanningGoalsPage() {
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
  const [activeTab, setActiveTab] = useState<TabId>('annual');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'annual':
        return <AnnualPlanningTab tenantId={tenantId} />;
      case 'quarterly':
        return <QuarterlyPlanningTab tenantId={tenantId} />;
      case 'goals':
        return <GoalsTab tenantId={tenantId} />;
      case 'metrics':
        return <MetricsTab tenantId={tenantId} />;
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
      <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTabContent()}
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId}
      />
    </div>
  );
}
