'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, LogIn, AlertTriangle, Loader2, Users } from 'lucide-react';
import { useAgencyUserSearch, type AgencyUserSearchResult } from '@/hooks/api/useAgency';
import { useStartImpersonation } from '@/hooks/api/useImpersonate';

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'bg-indigo-100 text-indigo-800',
  facilitator: 'bg-teal-100 text-teal-800',
  mentor: 'bg-amber-100 text-amber-800',
  learner: 'bg-green-100 text-green-800',
};

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Admin',
  facilitator: 'Facilitator',
  mentor: 'Mentor',
  learner: 'Learner',
};

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImpersonationSearchModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AgencyUserSearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);
  const startImpersonation = useStartImpersonation();

  const { data: users, isLoading, isFetching } = useAgencyUserSearch(debouncedSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (startImpersonation.isPending) return;
    setSearch('');
    setDebouncedSearch('');
    setSelectedUser(null);
    setReason('');
    setDuration(60);
    startImpersonation.reset();
    onClose();
  }, [onClose, startImpersonation]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const handleSelectUser = (user: AgencyUserSearchResult) => {
    setSelectedUser(user);
    startImpersonation.reset();
  };

  const handleBack = () => {
    setSelectedUser(null);
    setReason('');
    setDuration(60);
    startImpersonation.reset();
  };

  const handleStartImpersonation = () => {
    if (!selectedUser) return;
    startImpersonation.mutate({
      targetUserId: selectedUser.id,
      reason: reason.trim() || undefined,
      durationMinutes: duration,
    });
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;

  // Group users by tenant
  const grouped = (users || []).reduce<Record<string, AgencyUserSearchResult[]>>((acc, user) => {
    const key = user.tenantName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedUser ? 'Confirm Impersonation' : 'Login As User'}
          </h3>
          <button
            onClick={handleClose}
            disabled={startImpersonation.isPending}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedUser ? (
          <>
            {/* Search Input */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
                {isFetching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {search.length < 2 ? (
                <div className="px-4 py-12 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Type at least 2 characters to search</p>
                </div>
              ) : isLoading ? (
                <div className="px-4 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Searching users...</p>
                </div>
              ) : !users || users.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-500">No users found for &ldquo;{search}&rdquo;</p>
                </div>
              ) : (
                Object.entries(grouped).map(([tenantName, tenantUsers]) => (
                  <div key={tenantName}>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0">
                      {tenantName}
                    </div>
                    {tenantUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.roleSlug && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${ROLE_COLORS[user.roleSlug] || 'bg-gray-100 text-gray-800'}`}>
                                {ROLE_LABELS[user.roleSlug] || user.roleSlug}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                        <LogIn className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Confirmation Panel */
          <div className="p-4">
            {/* Back button */}
            <button
              onClick={handleBack}
              disabled={startImpersonation.isPending}
              className="text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              &larr; Back to search
            </button>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                You will see the platform exactly as <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> sees it.
                All actions are logged for audit.
              </div>
            </div>

            {/* Target user */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium">
                {getInitials(selectedUser.firstName, selectedUser.lastName)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</div>
                <div className="text-sm text-gray-500">{selectedUser.email} &middot; {selectedUser.tenantName}</div>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Investigating support ticket #1234"
                maxLength={500}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {startImpersonation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {startImpersonation.error?.message || 'Failed to start impersonation.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleBack}
                disabled={startImpersonation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartImpersonation}
                disabled={startImpersonation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {startImpersonation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {startImpersonation.isPending ? 'Switching...' : `Login as ${selectedUser.firstName}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
