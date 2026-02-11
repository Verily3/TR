'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Users,
  BookOpen,
  UserCheck,
  Shield,
  Search,
  Upload,
  UserPlus,
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  UserX,
} from 'lucide-react';
import { useAgencyEnrollments, useDeleteAgencyEnrollment } from '@/hooks/api/useAgencyEnrollments';
import { useEnrollments, useDeleteEnrollment } from '@/hooks/api/usePrograms';
import { AddParticipantModal } from './AddParticipantModal';
import { BulkInviteModal } from './BulkInviteModal';
import type { Enrollment, EnrollmentRole, EnrollmentStatus } from '@/types/programs';

// --- Types ---

interface ParticipantsTabProps {
  program: {
    id: string;
    stats?: {
      totalEnrollments: number;
      learnerCount: number;
      mentorCount: number;
      facilitatorCount: number;
    };
  };
  tenantId?: string;
  isAgencyContext: boolean;
}

interface EnrollmentWithTenant extends Enrollment {
  tenantName?: string | null;
}

// --- Constants ---

const roleColors: Record<EnrollmentRole, { bg: string; text: string }> = {
  learner: { bg: 'bg-blue-100', text: 'text-blue-700' },
  mentor: { bg: 'bg-purple-100', text: 'text-purple-700' },
  facilitator: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

const statusColors: Record<EnrollmentStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  dropped: { bg: 'bg-red-100', text: 'text-red-700' },
};

// --- Helpers ---

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '?';
}

function getFullName(user?: { firstName: string | null; lastName: string | null; email: string }): string {
  if (!user) return 'Unknown User';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Component ---

export function ParticipantsTab({ program, tenantId, isAgencyContext }: ParticipantsTabProps) {
  // Filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<EnrollmentRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Actions dropdown state
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Deletion confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build API params
  const apiParams = useMemo(() => ({
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
    limit: 100,
  }), [roleFilter, statusFilter, searchQuery]);

  // Fetch enrollments based on context
  const agencyQuery = useAgencyEnrollments(
    isAgencyContext ? program.id : undefined,
    isAgencyContext ? apiParams : undefined
  );

  const tenantQuery = useEnrollments(
    !isAgencyContext ? tenantId : undefined,
    !isAgencyContext ? program.id : undefined,
    !isAgencyContext ? apiParams : undefined
  );

  // Delete mutations
  const deleteAgencyEnrollment = useDeleteAgencyEnrollment(isAgencyContext ? program.id : undefined);
  const deleteTenantEnrollment = useDeleteEnrollment(
    !isAgencyContext ? tenantId : undefined,
    !isAgencyContext ? program.id : undefined
  );

  // Unified data
  const query = isAgencyContext ? agencyQuery : tenantQuery;
  const enrollments: EnrollmentWithTenant[] = useMemo(() => {
    return query.data?.enrollments || [];
  }, [query.data]);
  const totalCount = query.data?.total || enrollments.length;

  const isLoading = query.isLoading;
  const isError = query.isError;
  const error = query.error;

  // Stats from program or computed from enrollments
  const stats = useMemo(() => {
    if (program.stats) {
      return {
        total: program.stats.totalEnrollments,
        learners: program.stats.learnerCount,
        mentors: program.stats.mentorCount,
        facilitators: program.stats.facilitatorCount,
      };
    }
    // Fallback: compute from loaded enrollments
    return {
      total: totalCount,
      learners: enrollments.filter((e) => e.role === 'learner').length,
      mentors: enrollments.filter((e) => e.role === 'mentor').length,
      facilitators: enrollments.filter((e) => e.role === 'facilitator').length,
    };
  }, [program.stats, enrollments, totalCount]);

  // Close action menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionId(null);
      }
    }
    if (openActionId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openActionId]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === enrollments.length && enrollments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(enrollments.map((e) => e.id));
    }
  }, [selectedIds.length, enrollments]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Delete handler
  const handleDelete = useCallback(
    async (enrollmentId: string) => {
      setDeletingId(enrollmentId);
      try {
        if (isAgencyContext) {
          await deleteAgencyEnrollment.mutateAsync(enrollmentId);
        } else {
          await deleteTenantEnrollment.mutateAsync(enrollmentId);
        }
        setSelectedIds((prev) => prev.filter((id) => id !== enrollmentId));
      } catch {
        // Error is handled by React Query; toast could be added here
      } finally {
        setDeletingId(null);
        setOpenActionId(null);
      }
    },
    [isAgencyContext, deleteAgencyEnrollment, deleteTenantEnrollment]
  );

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-500">Total Enrolled</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{stats.learners}</span>
          </div>
          <p className="text-sm text-gray-500">Active Learners</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{stats.mentors}</span>
          </div>
          <p className="text-sm text-gray-500">Mentors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">{stats.facilitators}</span>
          </div>
          <p className="text-sm text-gray-500">Facilitators</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/30 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as EnrollmentRole | 'all')}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/30"
          >
            <option value="all">All Roles</option>
            <option value="learner">Learner</option>
            <option value="mentor">Mentor</option>
            <option value="facilitator">Facilitator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EnrollmentStatus | 'all')}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/30"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>

          {/* Add Participant */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Participant
          </button>

          {/* Import */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium mb-1">Failed to load participants</p>
          <p className="text-red-500 text-sm">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => query.refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading participants...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && enrollments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium mb-1">No participants found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No participants match your current filters. Try adjusting your search or filters.'
              : 'Get started by adding participants to this program.'}
          </p>
          {!searchQuery && roleFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add First Participant
            </button>
          )}
        </div>
      )}

      {/* Participants Table */}
      {!isLoading && !isError && enrollments.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === enrollments.length && enrollments.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600/20"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    {isAgencyContext && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enrollment) => {
                    const user = enrollment.user;
                    const fullName = getFullName(user);
                    const initials = getInitials(user?.firstName ?? null, user?.lastName ?? null);
                    const roleBadge = roleColors[enrollment.role];
                    const statusBadge = statusColors[enrollment.status];
                    const isDeleting = deletingId === enrollment.id;

                    return (
                      <tr
                        key={enrollment.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          isDeleting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(enrollment.id)}
                            onChange={() => toggleSelect(enrollment.id)}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600/20"
                          />
                        </td>

                        {/* Name with Avatar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {initials}
                            </div>
                            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                              {fullName}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">{user?.email || '-'}</span>
                        </td>

                        {/* Company (Agency context only) */}
                        {isAgencyContext && (
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">
                              {(enrollment as EnrollmentWithTenant).tenantName || 'Unaffiliated'}
                            </span>
                          </td>
                        )}

                        {/* Role Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}
                          >
                            {capitalize(enrollment.role)}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {capitalize(enrollment.status)}
                          </span>
                        </td>

                        {/* Progress Bar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-600 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 tabular-nums w-10 text-right">
                              {enrollment.progress}%
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="relative" ref={openActionId === enrollment.id ? actionMenuRef : undefined}>
                            <button
                              onClick={() =>
                                setOpenActionId(openActionId === enrollment.id ? null : enrollment.id)
                              }
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              aria-label="Actions"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              )}
                            </button>

                            {openActionId === enrollment.id && !isDeleting && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => handleDelete(enrollment.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Info */}
          <div className="text-sm text-gray-500">
            Showing {enrollments.length} of {totalCount} participants
          </div>
        </>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddParticipantModal
          programId={program.id}
          tenantId={tenantId}
          isAgencyContext={isAgencyContext}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkInviteModal
          programId={program.id}
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
}

export default ParticipantsTab;
