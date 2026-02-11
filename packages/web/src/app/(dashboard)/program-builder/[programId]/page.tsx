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
  Save,
  BarChart3,
  Upload,
  LinkIcon,
  Globe,
  Eye,
  Calendar,
  AlertCircle,
  Award,
  UserPlus,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useProgram,
  useUpdateProgram,
} from '@/hooks/api/usePrograms';
import {
  useAgencyProgram,
  useUpdateAgencyProgram,
} from '@/hooks/api/useAgencyPrograms';
import { ParticipantsTab } from '@/components/programs/ParticipantsTab';
import { InfoTab } from '@/components/programs/InfoTab';
import { CurriculumTab } from '@/components/programs/CurriculumTab';

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
          The program you are looking for could not be loaded. It may have been deleted or you may not have permission to access it.
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
// Goals Tab (Empty State)
// ============================================

function GoalsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Program Goals</h3>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <LinkIcon className="w-4 h-4" />
          Link Goal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-yellow-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">No Goals Linked</h3>
        <p className="text-sm text-gray-500">
          Link organizational, team, or individual goals to this program to track alignment and progress.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Strategic Goals', count: 0, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Team Goals', count: 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Individual Goals', count: 0, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${category.bg}`}>
                  <Icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-900">{category.label}</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{category.count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Resources Tab (Empty State)
// ============================================

function ResourcesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Program Resources</h3>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">No Resources Added</h3>
        <p className="text-sm text-gray-500">
          Upload documents, templates, and media files to support program participants.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Documents', count: 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Templates', count: 0, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'External Links', count: 0, icon: LinkIcon, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Media', count: 0, icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${category.bg}`}>
                  <Icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-900">{category.label}</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{category.count}</p>
            </div>
          );
        })}
      </div>

      {/* Drag-and-drop zone placeholder */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-600/30 transition-colors">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-1">Drag and drop files here</p>
        <p className="text-xs text-gray-400">or click Upload File above</p>
      </div>
    </div>
  );
}

// ============================================
// Reports Tab (Mock Data)
// ============================================

function ReportsTab() {
  const stats = [
    { label: 'Total Enrolled', value: '28', icon: Users, bg: 'bg-red-50', iconColor: 'text-red-600' },
    { label: 'Avg Completion', value: '67%', icon: Award, bg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Avg Time Spent', value: '4.2h', icon: Clock, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Weeks Remaining', value: '9', icon: Calendar, bg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  ];

  const modulePerformance = [
    { name: 'Module 1: Foundation', progress: 92 },
    { name: 'Module 2: Strategy', progress: 78 },
    { name: 'Module 3: Execution', progress: 45 },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'completed Module 2: Strategy', time: '2 hours ago', icon: CheckCircle },
    { user: 'Michael Torres', action: 'submitted Assignment 3', time: '5 hours ago', icon: ClipboardList },
    { user: 'Emily Watson', action: 'joined the program', time: '1 day ago', icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
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

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['Completion Progress', 'Engagement Over Time'].map((title) => (
          <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">{title}</h4>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Module Performance</h4>
        <div className="space-y-4">
          {modulePerformance.map((mod) => (
            <div key={mod.name} className="flex items-center gap-4">
              <span className="text-sm text-gray-700 w-48 shrink-0 truncate">{mod.name}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${mod.progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-10 text-right">{mod.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Activity</h4>
        <div className="space-y-3">
          {recentActivity.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{item.user}</span>{' '}
                    {item.action}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
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
  const agencyProgramQuery = useAgencyProgram(
    !tenantId && isAgencyUser ? programId : undefined
  );

  // Use whichever query returned data
  const program = tenantProgramQuery.data || agencyProgramQuery.data;
  const isLoading = tenantProgramQuery.isLoading || agencyProgramQuery.isLoading;
  const error = tenantProgramQuery.error && agencyProgramQuery.error;

  // Determine if this is an agency-level program (no tenantId on the program itself)
  const isAgencyContext = isAgencyUser && (!program?.tenantId);

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
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
                {statusConfig.label.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {program.config?.learningTrack || (program.type === 'cohort' ? 'Cohort Program' : 'Self-Paced Program')}
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
        <CurriculumTab
          program={program}
          tenantId={tenantId}
          isAgencyContext={isAgencyContext}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsTab
          program={program}
          tenantId={tenantId}
          isAgencyContext={isAgencyContext}
        />
      )}

      {activeTab === 'info' && (
        <InfoTab
          program={program}
          onSave={(input) => updateProgram.mutateAsync(input)}
          isSaving={updateProgram.isPending}
        />
      )}

      {activeTab === 'goals' && <GoalsTab />}

      {activeTab === 'resources' && <ResourcesTab />}

      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
}
