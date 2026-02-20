'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTenants } from '@/hooks/api/useTenants';
import { useSurveys, useCreateSurvey, useDeleteSurvey } from '@/hooks/api/useSurveys';
import {
  ClipboardCheck,
  Plus,
  BarChart2,
  Link as LinkIcon,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { Survey, SurveyStatus } from '@/types/surveys';

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SurveyStatus }) {
  const config = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: Clock },
    active: { label: 'Active', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-500', icon: AlertCircle },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}

// ── Survey card ───────────────────────────────────────────────────────────────

function SurveyCard({
  survey,
  onDelete,
  isDeleting,
}: {
  survey: Survey;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!survey.shareToken) return;
    const url = `${window.location.origin}/survey/${survey.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => router.push(`/surveys/${survey.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/surveys/${survey.id}`)}
      aria-label={`Open survey: ${survey.title}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sidebar-foreground text-sm truncate group-hover:text-accent transition-colors">
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{survey.description}</p>
            )}
          </div>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
          {survey.questionCount ?? 0} questions
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          {survey.responseCount ?? 0} responses
        </span>
        {survey.anonymous && (
          <span className="text-blue-600">Anonymous</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {survey.status === 'active' && survey.shareToken && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all"
              aria-label="Copy share link"
            >
              <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          )}
          {(survey.responseCount ?? 0) > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/surveys/${survey.id}?tab=results`); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:border-accent/30 hover:text-accent transition-all"
              aria-label="View results"
            >
              <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
              Results
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this survey? This cannot be undone.')) {
                onDelete(survey.id);
              }
            }}
            disabled={isDeleting}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
            aria-label={`Delete survey: ${survey.title}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// ── Create modal ───────────────────────────────────────────────────────────────

function CreateSurveyModal({
  onClose,
  onCreated,
  tenantId,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  tenantId: string;
}) {
  const [title, setTitle] = useState('');
  const createMutation = useCreateSurvey(tenantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const survey = await createMutation.mutateAsync({ title: title.trim() });
    onCreated(survey.id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create new survey"
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">New Survey</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1.5" htmlFor="survey-title">
              Survey title
            </label>
            <input
              id="survey-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Program Satisfaction Survey"
              className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SurveyStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const isAgencyUser = !!(user?.agencyId && !user?.tenantId);
  const { data: tenants } = useTenants();

  // Auto-select first tenant for agency users
  const tenantId = isAgencyUser
    ? (selectedTenantId ?? tenants?.[0]?.id ?? null)
    : (user?.tenantId ?? null);

  const { data: surveys = [], isLoading } = useSurveys(tenantId);
  const deleteMutation = useDeleteSurvey(tenantId);

  const filtered = activeTab === 'all'
    ? surveys
    : surveys.filter((s) => s.status === activeTab);

  const counts = {
    all: surveys.length,
    draft: surveys.filter((s) => s.status === 'draft').length,
    active: surveys.filter((s) => s.status === 'active').length,
    closed: surveys.filter((s) => s.status === 'closed').length,
  };

  const handleDelete = async (surveyId: string) => {
    try {
      await deleteMutation.mutateAsync(surveyId);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sidebar-foreground">Surveys</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage feedback surveys
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAgencyUser && tenants && tenants.length > 1 && (
            <select
              value={selectedTenantId ?? tenants[0]?.id ?? ''}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Select client"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {tenantId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg"
              aria-label="Create new survey"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Survey
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {(['all', 'draft', 'active', 'closed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-muted-foreground hover:text-sidebar-foreground'
            }`}
            aria-selected={activeTab === tab}
          >
            <span className="capitalize">{tab === 'all' ? 'All Surveys' : tab}</span>
            <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {!tenantId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">Select a client to view surveys.</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <ClipboardCheck className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-sidebar-foreground mb-2">
            {activeTab === 'all' ? 'No surveys yet' : `No ${activeTab} surveys`}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {activeTab === 'all'
              ? 'Create your first survey to gather feedback from your participants.'
              : `You have no ${activeTab} surveys at this time.`}
          </p>
          {activeTab === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Survey
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && tenantId && (
        <CreateSurveyModal
          tenantId={tenantId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.push(`/surveys/${id}`);
          }}
        />
      )}
    </div>
  );
}
