'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  MoreVertical,
  Pencil,
  Copy,
  Users,
  Clock,
  FolderOpen,
  Trash2,
  Filter,
  Target,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAgencyPrograms, useDeleteAgencyProgram, useDuplicateAgencyProgram } from '@/hooks/api/useAgencyPrograms';
import { usePrograms, useDeleteProgram, useDuplicateProgram } from '@/hooks/api/usePrograms';
import type { Program } from '@/types/programs';

// ============================================
// Types & Config
// ============================================

type DisplayStatus = 'active' | 'draft' | 'archived';
type FilterTab = 'all' | 'active' | 'draft' | 'archived';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
];

const STATUS_CONFIG: Record<
  DisplayStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: 'Published',
    className: 'bg-green-50 text-green-700 border border-green-200',
    icon: CheckCircle2,
  },
  draft: {
    label: 'Draft',
    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    icon: AlertCircle,
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 border border-gray-200',
    icon: Archive,
  },
};

// ============================================
// Helper functions
// ============================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================
// Sub-components
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-3 bg-gray-200 rounded" />
            </div>
            <div className="w-10 h-8 bg-gray-200 rounded mb-1" />
            <div className="w-20 h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-gray-100 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-3 bg-gray-200 rounded" />
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded-full" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsBar({ programs }: { programs: Program[] }) {
  const stats = useMemo(() => {
    const total = programs.length;
    const draft = programs.filter((p) => p.status === 'draft').length;
    const activePrograms = programs.filter((p) => p.status === 'active');
    const totalLearners = programs.reduce((sum, p) => sum + Number(p.learnerCount || 0), 0);
    let avgCompletion = 0;
    if (activePrograms.length > 0) {
      const completionSum = activePrograms.reduce((sum, p) => sum + Number(p.avgProgress || 0), 0);
      avgCompletion = Math.round(completionSum / activePrograms.length);
    }
    return { total, totalLearners, avgCompletion, draft };
  }, [programs]);

  const items = [
    {
      label: 'TOTAL PROGRAMS',
      value: stats.total.toString(),
      subtitle: 'Across all tracks',
      icon: <BookOpen className="w-4 h-4 text-red-600" />,
    },
    {
      label: 'ACTIVE LEARNERS',
      value: stats.totalLearners.toString(),
      subtitle: 'Currently enrolled',
      icon: <Users className="w-4 h-4 text-red-600" />,
    },
    {
      label: 'AVG COMPLETION',
      value: `${stats.avgCompletion}%`,
      subtitle: 'Across published programs',
      icon: <Target className="w-4 h-4 text-red-600" />,
    },
    {
      label: 'IN DEVELOPMENT',
      value: stats.draft.toString(),
      subtitle: 'Draft programs',
      icon: <Clock className="w-4 h-4 text-red-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4"
        >
          <div className="flex items-center gap-2 mb-2">
            {item.icon}
            <span className="text-xs font-medium text-gray-500 tracking-wide">{item.label}</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
          <p className="text-sm text-gray-400 mt-0.5">{item.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ActionMenu({
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => { onClose(); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Program
            </button>
            <button
              onClick={() => { onClose(); onDuplicate(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { onClose(); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ProgramTable({
  programs,
  openMenuId,
  onOpenMenu,
  onCloseMenu,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  programs: Program[];
  openMenuId: string | null;
  onOpenMenu: (id: string) => void;
  onCloseMenu: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_120px_160px_150px_160px_80px] gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Program</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Structure</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
      </div>

      {/* Table Rows */}
      {programs.map((program) => {
        const learningTrack = program.config?.learningTrack;

        return (
          <div
            key={program.id}
            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
          >
            {/* Desktop Row */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_120px_160px_150px_160px_80px] gap-4 px-6 py-4 items-center">
              {/* Program */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <button
                    onClick={() => onEdit(program.id)}
                    className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors truncate block text-left"
                  >
                    {program.name}
                  </button>
                  <p className="text-xs text-gray-400 truncate">
                    {learningTrack || program.type?.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={program.status as DisplayStatus} />
              </div>

              {/* Structure */}
              <div>
                {Number(program.moduleCount || 0) > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {Number(program.moduleCount)} module{Number(program.moduleCount) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Number(program.lessonCount || 0) > 0
                        ? `${Number(program.lessonCount)} lessons \u2022 ${Number(program.totalPoints || 0).toLocaleString()} pts`
                        : 'No lessons yet'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">&mdash;</p>
                )}
              </div>

              {/* Engagement */}
              <div>
                {Number(program.learnerCount || 0) > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {Number(program.learnerCount)} learners
                    </p>
                    <p className="text-xs text-gray-400">
                      {Number(program.avgProgress || 0) > 0 ? `${Number(program.avgProgress)}% completion` : '—'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">&mdash;</p>
                )}
              </div>

              {/* Updated */}
              <div>
                <p className="text-sm text-gray-900">{formatDate(program.updatedAt || program.createdAt)}</p>
                {program.createdByName && (
                  <p className="text-xs text-gray-400">by {program.createdByName}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => onEdit(program.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <ActionMenu
                  isOpen={openMenuId === program.id}
                  onToggle={() => openMenuId === program.id ? onCloseMenu() : onOpenMenu(program.id)}
                  onClose={onCloseMenu}
                  onEdit={() => onEdit(program.id)}
                  onDuplicate={() => onDuplicate(program.id)}
                  onDelete={() => onDelete(program.id)}
                />
              </div>
            </div>

            {/* Mobile Card */}
            <div className="lg:hidden px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => onEdit(program.id)}
                        className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors truncate block text-left"
                      >
                        {program.name}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {learningTrack || program.type?.replace('_', ' ')}
                      </p>
                    </div>
                    <ActionMenu
                      isOpen={openMenuId === program.id}
                      onToggle={() => openMenuId === program.id ? onCloseMenu() : onOpenMenu(program.id)}
                      onClose={onCloseMenu}
                      onEdit={() => onEdit(program.id)}
                      onDuplicate={() => onDuplicate(program.id)}
                      onDelete={() => onDelete(program.id)}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <StatusBadge status={program.status as DisplayStatus} />
                    {Number(program.learnerCount || 0) > 0 && (
                      <span className="text-xs text-gray-500">{Number(program.learnerCount)} learners</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(program.updatedAt || program.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ filter, search, onCreateClick }: { filter: FilterTab; search: string; onCreateClick?: () => void }) {
  const hasSearch = search.trim().length > 0;
  const isFiltered = filter !== 'all';
  const filterLabel = filter === 'active' ? 'published' : filter;

  let message = 'No programs found.';
  if (hasSearch && isFiltered) {
    message = `No ${filterLabel} programs matching "${search}".`;
  } else if (hasSearch) {
    message = `No programs matching "${search}".`;
  } else if (isFiltered) {
    message = `No ${filterLabel} programs yet.`;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="mx-auto w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
        <FolderOpen className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{message}</h3>
      <p className="text-sm text-gray-500 mb-6">
        {hasSearch
          ? 'Try adjusting your search or filter criteria.'
          : 'Get started by creating your first program.'}
      </p>
      {!hasSearch && !isFiltered && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Program
        </button>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ProgramBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isAgencyUser = !!user?.agencyId;
  const tenantId = user?.tenantId;

  const { data: agencyData, isLoading: agencyLoading } = useAgencyPrograms(
    isAgencyUser ? { limit: 100 } : undefined
  );
  const { data: tenantData, isLoading: tenantLoading } = usePrograms(
    !isAgencyUser ? tenantId : undefined,
    !isAgencyUser ? { limit: 100 } : undefined
  );

  const deleteAgencyProgram = useDeleteAgencyProgram();
  const duplicateAgencyProgram = useDuplicateAgencyProgram();
  const deleteTenantProgram = useDeleteProgram(tenantId);
  const duplicateTenantProgram = useDuplicateProgram(tenantId);

  const isLoading = isAgencyUser ? agencyLoading : tenantLoading;
  const allPrograms: Program[] = isAgencyUser
    ? (agencyData?.programs || [])
    : (tenantData?.programs || []);

  const filteredPrograms = useMemo(() => {
    let result = allPrograms;

    if (activeTab !== 'all') {
      result = result.filter((p) => p.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [allPrograms, activeTab, searchQuery]);

  const handleEdit = (programId: string) => {
    const program = allPrograms.find((p) => p.id === programId);
    const tenantParam = program?.tenantId ? `?tenantId=${program.tenantId}` : '';
    router.push(`/program-builder/${programId}${tenantParam}`);
  };

  const handleDuplicate = (programId: string) => {
    if (isAgencyUser) {
      duplicateAgencyProgram.mutate(programId);
    } else {
      duplicateTenantProgram.mutate(programId);
    }
  };

  const handleDelete = (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    if (isAgencyUser) {
      deleteAgencyProgram.mutate(programId);
    } else {
      deleteTenantProgram.mutate(programId);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Program Builder</h1>
            <p className="text-gray-500 text-sm mt-1">
              Create and manage learning programs for your organization
            </p>
          </div>
          <button
            onClick={() => router.push('/program-builder/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create New Program
          </button>
        </div>
      </header>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stats Bar */}
          <StatsBar programs={allPrograms} />

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-colors"
              />
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Program Table */}
          {filteredPrograms.length > 0 ? (
            <ProgramTable
              programs={filteredPrograms}
              openMenuId={openMenuId}
              onOpenMenu={setOpenMenuId}
              onCloseMenu={() => setOpenMenuId(null)}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ) : (
            <EmptyState filter={activeTab} search={searchQuery} onCreateClick={() => router.push('/program-builder/new')} />
          )}
        </>
      )}

    </div>
  );
}
