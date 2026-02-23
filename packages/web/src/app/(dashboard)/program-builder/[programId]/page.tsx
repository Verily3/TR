'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { EnrollmentRole } from '@/types/programs';
import {
  ArrowLeft,
  ChevronLeft,
  ClipboardList,
  Users,
  FileText,
  Target,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  Save,
  BarChart3,
  Upload,
  LinkIcon,
  Globe,
  Eye,
  Calendar,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useProgram,
  useUpdateProgram,
  useProgramStats,
  useProgramGoals,
} from '@/hooks/api/usePrograms';
import { useAgencyProgram, useUpdateAgencyProgram } from '@/hooks/api/useAgencyPrograms';
import { ParticipantsTab } from '@/components/programs/ParticipantsTab';
import { InfoTab } from '@/components/programs/InfoTab';
import { CurriculumTab } from '@/components/programs/CurriculumTab';
import {
  useResources,
  useUploadResource,
  useAddResourceLink,
  useDeleteResource,
} from '@/hooks/api/useResources';
import { Loader2, Trash2, Download, ExternalLink, XCircle } from 'lucide-react';

// ============================================
// Constants & Config
// ============================================

type TabId = 'info' | 'curriculum' | 'participants' | 'goals' | 'resources' | 'reports';
const TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Program Info' },
  { id: 'curriculum', label: 'Structure & Content' },
  { id: 'participants', label: 'Participants' },
  { id: 'goals', label: 'Program Goals' },
  { id: 'resources', label: 'Resources' },
  { id: 'reports', label: 'Reports' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  active: { label: 'Published', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

// ============================================
// Loading Skeleton
// ============================================

function LoadingSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-64 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="w-28 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="w-full h-12 bg-gray-100 rounded-lg mb-6 animate-pulse" />

      {/* Content skeleton */}
      <div className="flex gap-6">
        <div className="w-2/5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
              <div className="w-1/2 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="w-1/2 h-6 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="w-2/3 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Error State
// ============================================

function ErrorState({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Program Not Found</h3>
        <p className="text-sm text-gray-500 mb-6">
          The program you are looking for could not be loaded. It may have been deleted or you may
          not have permission to access it.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Program Builder
        </button>
      </div>
    </div>
  );
}

// ============================================
// Goals Tab
// ============================================

const GOAL_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-50 text-green-700' },
  completed: { label: 'Completed', className: 'bg-blue-50 text-blue-700' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
};

function GoalsTab({ tenantId, programId }: { tenantId: string | undefined; programId: string }) {
  const { data, isLoading } = useProgramGoals(tenantId, programId);

  if (!tenantId) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground border border-border rounded-xl">
        Goals are tracked for learner-enrolled tenant programs.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const goals = data?.goals ?? [];

  const statCards = [
    { label: 'Total Goals', value: stats?.total ?? 0, icon: Target, accent: false },
    { label: 'Active', value: stats?.active ?? 0, icon: TrendingUp, accent: true },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, accent: false },
    { label: 'Avg Progress', value: `${stats?.avgProgress ?? 0}%`, icon: BarChart3, accent: false },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-sidebar-foreground">Program Goals</h3>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${accent ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <div
              className={`text-2xl font-semibold ${accent ? 'text-accent' : 'text-sidebar-foreground'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-base font-medium text-sidebar-foreground mb-1">No Goals Set Yet</h3>
          <p className="text-sm text-muted-foreground">
            Learner goals will appear here once participants complete goal-setting lessons in this
            program.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h4 className="text-sm font-medium text-sidebar-foreground">
              Learner Goals ({goals.length})
            </h4>
          </div>
          <div className="divide-y divide-border">
            {goals.map((goal) => {
              const statusStyle = GOAL_STATUS_CONFIG[goal.status] ?? GOAL_STATUS_CONFIG.draft;
              return (
                <div key={goal.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                      {goal.learnerInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-medium text-sidebar-foreground leading-snug">
                          {goal.statement}
                        </p>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span>{goal.learnerName}</span>
                        <span>·</span>
                        <span>{goal.lessonTitle}</span>
                        {goal.targetDate && (
                          <>
                            <span>·</span>
                            <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                          </>
                        )}
                        {goal.reviewCount > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {goal.reviewCount} review{goal.reviewCount !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      {goal.latestProgress !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-36 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all"
                              style={{ width: `${goal.latestProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {goal.latestProgress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Resources Tab (Connected to API)
// ============================================

function ResourcesTab({
  tenantId,
  programId,
}: {
  tenantId: string | undefined;
  programId: string;
}) {
  const tid = tenantId ?? null;
  const { data: resources, isLoading } = useResources(tid, programId);
  const uploadResource = useUploadResource(tid, programId);
  const addLink = useAddResourceLink(tid, programId);
  const deleteResource = useDeleteResource(tid, programId);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 50 * 1024 * 1024) {
      setError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 50 MB.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    // Auto-categorize based on MIME type
    const category =
      file.type.startsWith('image/') || file.type.startsWith('video/') ? 'media' : 'document';
    formData.append('category', category);

    try {
      await uploadResource.mutateAsync(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    e.target.value = '';
  };

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    setError(null);
    try {
      await addLink.mutateAsync({
        name: linkName.trim(),
        externalUrl: linkUrl.trim(),
        category: 'link',
      });
      setLinkName('');
      setLinkUrl('');
      setShowLinkForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryCounts = (resources || []).reduce(
    (acc, r) => {
      const cat = r.category || 'document';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = [
    {
      label: 'Documents',
      key: 'document',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Templates',
      key: 'template',
      icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'External Links',
      key: 'link',
      icon: LinkIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    { label: 'Media', key: 'media', icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Program Resources</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Add Link
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer">
            {uploadResource.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadResource.isPending}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Add Link Form */}
      {showLinkForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Link name"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddLink}
              disabled={!linkName.trim() || !linkUrl.trim() || addLink.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {addLink.isPending ? 'Adding...' : 'Add Link'}
            </button>
            <button
              onClick={() => {
                setShowLinkForm(false);
                setLinkName('');
                setLinkUrl('');
              }}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${category.bg}`}>
                  <Icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-900">{category.label}</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {categoryCounts[category.key] || 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Resource List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading resources...
        </div>
      ) : !resources || resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No Resources Added</h3>
          <p className="text-sm text-gray-500">
            Upload documents, templates, and media files to support program participants.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    resource.category === 'media'
                      ? 'bg-orange-50'
                      : resource.category === 'link'
                        ? 'bg-green-50'
                        : resource.category === 'template'
                          ? 'bg-purple-50'
                          : 'bg-blue-50'
                  }`}
                >
                  {resource.externalUrl ? (
                    <LinkIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <FileText
                      className={`w-4 h-4 ${
                        resource.category === 'media'
                          ? 'text-orange-600'
                          : resource.category === 'template'
                            ? 'text-purple-600'
                            : 'text-blue-600'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                  <p className="text-xs text-gray-500">
                    {resource.externalUrl
                      ? 'External Link'
                      : `${resource.mimeType} ${formatFileSize(resource.fileSize)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                {resource.externalUrl ? (
                  <a
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                ) : null}
                <button
                  onClick={() => {
                    if (confirm('Delete this resource?')) {
                      deleteResource.mutate(resource.id);
                    }
                  }}
                  disabled={deleteResource.isPending}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-600/30 transition-colors cursor-pointer">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-1">Drag and drop files here</p>
        <p className="text-xs text-gray-400">or click to browse (up to 50MB)</p>
        <input
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploadResource.isPending}
        />
      </label>
    </div>
  );
}

// ============================================
// Reports Tab
// ============================================

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ReportsTab({ tenantId, programId }: { tenantId: string | undefined; programId: string }) {
  const { data, isLoading } = useProgramStats(tenantId, programId);

  const statsCards = [
    {
      label: 'Total Enrolled',
      value: isLoading ? '—' : String(data?.totalEnrolled ?? 0),
      icon: Users,
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      label: 'Avg Completion',
      value: isLoading ? '—' : `${data?.avgCompletion ?? 0}%`,
      icon: Award,
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Completed',
      value: isLoading ? '—' : String(data?.completedCount ?? 0),
      icon: CheckCircle,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Weeks Remaining',
      value: isLoading ? '—' : data?.weeksRemaining != null ? String(data.weeksRemaining) : 'N/A',
      icon: Calendar,
      bg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-lg ${item.bg}`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Module Performance</h4>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && (!data?.modulePerformance || data.modulePerformance.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-4">No modules yet</p>
        )}
        {!isLoading && data?.modulePerformance && data.modulePerformance.length > 0 && (
          <div className="space-y-4">
            {data.modulePerformance.map((mod) => (
              <div key={mod.name} className="flex items-center gap-4">
                <span className="text-sm text-gray-700 w-48 shrink-0 truncate" title={mod.name}>
                  {mod.name}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${mod.completionPct}%` }}
                    role="progressbar"
                    aria-valuenow={mod.completionPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right tabular-nums">
                  {mod.completionPct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Activity</h4>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && (!data?.recentActivity || data.recentActivity.length === 0) && (
          <div className="text-center py-6">
            <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No activity yet</p>
          </div>
        )}
        {!isLoading && data?.recentActivity && data.recentActivity.length > 0 && (
          <div className="space-y-3">
            {data.recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div className="p-1.5 bg-green-50 rounded-lg shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium text-gray-900">{item.userName}</span> {item.action}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatTimeAgo(item.completedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ProgramBuilderEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const programId = params.programId as string;

  // For agency users without a tenantId, fall back to the tenantId
  // passed via query parameter from the listing page.
  const tenantId = user?.tenantId || searchParams.get('tenantId') || undefined;
  const isAgencyUser = !!user?.agencyId;

  // Try tenant route first, fall back to agency route for agency-level programs
  const tenantProgramQuery = useProgram(tenantId, programId);
  const agencyProgramQuery = useAgencyProgram(!tenantId && isAgencyUser ? programId : undefined);

  // Use whichever query returned data
  const program = tenantProgramQuery.data || agencyProgramQuery.data;
  const isLoading = tenantProgramQuery.isLoading || agencyProgramQuery.isLoading;
  const error = tenantProgramQuery.error && agencyProgramQuery.error;

  // Determine if this is an agency-level program (no tenantId on the program itself)
  const isAgencyContext = isAgencyUser && !program?.tenantId;

  // Use matching update hooks
  const updateTenantProgram = useUpdateProgram(tenantId, programId);
  const updateAgencyProg = useUpdateAgencyProgram(isAgencyContext ? programId : undefined);

  const updateProgram = isAgencyContext ? updateAgencyProg : updateTenantProgram;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [previewRole, setPreviewRole] = useState<EnrollmentRole>('learner');

  const handleBack = () => {
    router.push('/program-builder');
  };

  // Loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error / Not Found
  if (error || !program) {
    return <ErrorState onBack={handleBack} />;
  }

  const statusConfig = STATUS_CONFIG[program.status] || STATUS_CONFIG.draft;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* ========= Header ========= */}
      <header className="mb-6">
        {/* Back link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Programs
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{program.name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.className}`}
              >
                {statusConfig.label.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {program.config?.learningTrack ||
                (program.type === 'cohort' ? 'Cohort Program' : 'Self-Paced Program')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (tenantId) params.set('tenantId', tenantId);
                  params.set('previewRole', previewRole);
                  window.open(`/programs/${programId}/learn?${params.toString()}`, '_blank');
                }}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value as EnrollmentRole)}
                className="border-l border-gray-200 px-2 py-2.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 outline-none cursor-pointer"
                title="Preview as role"
              >
                <option value="learner">as Learner</option>
                <option value="mentor">as Mentor</option>
                <option value="facilitator">as Facilitator</option>
              </select>
            </div>
            {program.status === 'draft' ? (
              <button
                onClick={() => updateProgram.mutate({ status: 'active' })}
                disabled={updateProgram.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                {updateProgram.isPending ? 'Publishing...' : 'Publish Program'}
              </button>
            ) : program.status === 'active' ? (
              <button
                onClick={() => updateProgram.mutate({ status: 'draft' })}
                disabled={updateProgram.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateProgram.isPending ? 'Unpublishing...' : 'Unpublish'}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* ========= Tab Navigation ========= */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========= Tab Content ========= */}
      {activeTab === 'curriculum' && (
        <CurriculumTab program={program} tenantId={tenantId} isAgencyContext={isAgencyContext} />
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab program={program} tenantId={tenantId} isAgencyContext={isAgencyContext} />
      )}

      {activeTab === 'info' && (
        <InfoTab
          program={program}
          onSave={(input) => updateProgram.mutateAsync(input)}
          isSaving={updateProgram.isPending}
        />
      )}

      {activeTab === 'goals' && <GoalsTab tenantId={tenantId} programId={programId} />}

      {activeTab === 'resources' && <ResourcesTab tenantId={tenantId} programId={programId} />}

      {activeTab === 'reports' && <ReportsTab tenantId={tenantId} programId={programId} />}
    </div>
  );
}
