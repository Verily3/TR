'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, User } from 'lucide-react';
import { useTenants } from '@/hooks/api/useTenants';
import {
  useAgencyUserSearch,
  useCreateAgencyEnrollment,
} from '@/hooks/api/useAgencyEnrollments';
import { useCreateEnrollment } from '@/hooks/api/usePrograms';
import type { EnrollmentRole } from '@/types/programs';

// ============================================
// Types
// ============================================

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
  programId: string;
  isAgencyContext: boolean;
  tenantId?: string;
  onSuccess?: () => void;
}

interface SelectedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tenantName: string | null;
}

// ============================================
// Constants
// ============================================

const ROLES: { value: EnrollmentRole; label: string; color: string }[] = [
  { value: 'learner', label: 'Learner', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'mentor', label: 'Mentor', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  {
    value: 'facilitator',
    label: 'Facilitator',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
];

// ============================================
// Helper
// ============================================

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  return email[0].toUpperCase();
}

function getDisplayName(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  return email;
}

// ============================================
// Component
// ============================================

export function AddParticipantModal({
  open,
  onClose,
  programId,
  isAgencyContext,
  tenantId,
  onSuccess,
}: AddParticipantModalProps) {
  // -- State --
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [role, setRole] = useState<EnrollmentRole>('learner');
  const [error, setError] = useState('');

  // -- Hooks --
  const { data: tenants } = useTenants();

  const agencySearchTenantId = selectedTenantId || undefined;
  const { data: searchResults, isLoading: isSearching } = useAgencyUserSearch(
    isAgencyContext ? searchQuery : '',
    agencySearchTenantId,
  );

  const createAgencyEnrollment = useCreateAgencyEnrollment(programId);
  const createTenantEnrollment = useCreateEnrollment(tenantId, programId);

  const isPending = createAgencyEnrollment.isPending || createTenantEnrollment.isPending;

  // -- Reset state when modal opens/closes --
  useEffect(() => {
    if (!open) {
      setSelectedTenantId('');
      setSearchQuery('');
      setSelectedUser(null);
      setRole('learner');
      setError('');
    }
  }, [open]);

  // -- Keyboard handling --
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // -- Handlers --
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSelectUser = (user: SelectedUser) => {
    setSelectedUser(user);
    setSearchQuery('');
    setError('');
  };

  const handleDeselectUser = () => {
    setSelectedUser(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Please select a user to enroll.');
      return;
    }

    setError('');

    try {
      if (isAgencyContext) {
        await createAgencyEnrollment.mutateAsync({
          userId: selectedUser.id,
          role,
        });
      } else {
        await createTenantEnrollment.mutateAsync({
          userId: selectedUser.id,
          role,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to add participant. Please try again.';
      setError(message);
    }
  };

  // -- Early return --
  if (!open) return null;

  // -- Render --
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-participant-title"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-accent" />
            </div>
            <h2
              id="add-participant-title"
              className="text-lg font-semibold text-sidebar-foreground"
            >
              Add Participant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Client Selector (Agency context only) */}
          {isAgencyContext && (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                Select Client
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setSelectedUser(null);
                  setSearchQuery('');
                }}
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5 text-sm text-sidebar-foreground focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
              >
                <option value="">No Client (Assign Later)</option>
                {tenants?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Selection Area */}
          {selectedUser ? (
            /* Selected User Display */
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                Selected User
              </label>
              <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-semibold">
                    {getInitials(selectedUser.firstName, selectedUser.lastName, selectedUser.email)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {getDisplayName(
                        selectedUser.firstName,
                        selectedUser.lastName,
                        selectedUser.email,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleDeselectUser}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-white transition-colors"
                  aria-label="Deselect user"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Search Users */
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email (min 2 characters)..."
                  className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="mt-2 border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-6 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground mt-2">Searching users...</p>
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <ul role="listbox">
                      {searchResults.map((user) => (
                        <li key={user.id}>
                          <button
                            onClick={() =>
                              handleSelectUser({
                                id: user.id,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                tenantName: user.tenantName,
                              })
                            }
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                          >
                            <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(user.firstName, user.lastName, user.email)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {getDisplayName(user.firstName, user.lastName, user.email)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                                {user.tenantName && (
                                  <span className="ml-1.5 text-muted-foreground/70">
                                    &middot; {user.tenantName}
                                  </span>
                                )}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <User className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Try a different search term
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Hint when not searching */}
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          )}

          {/* For tenant context without agency search, show a simple userId input */}
          {!isAgencyContext && !selectedUser && (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                User ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter user ID to enroll..."
                  className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        handleSelectUser({
                          id: value,
                          email: value,
                          firstName: null,
                          lastName: null,
                          tenantName: null,
                        });
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Press Enter to confirm the user ID
              </p>
            </div>
          )}

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">Role</label>
            <div className="flex gap-2">
              {ROLES.map((r) => {
                const isSelected = role === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`
                      flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                      ${
                        isSelected
                          ? `${r.color} border-current ring-1 ring-current/20`
                          : 'bg-white border-border text-muted-foreground hover:bg-muted/50 hover:text-sidebar-foreground'
                      }
                    `}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-sidebar-foreground transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !selectedUser}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add Participant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddParticipantModal;
