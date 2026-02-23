'use client';

import { useState } from 'react';
import { useChangeUserRole } from '@/hooks/api/useUsers';
import { RoleBadge } from './RoleBadge';

interface ChangeRoleModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  userId: string;
  userName: string;
  currentRoles: string[];
}

const ROLES = [
  { value: 'learner', label: 'Learner', description: 'Program participant' },
  { value: 'mentor', label: 'Mentor', description: 'Guides and supports assigned learners' },
  { value: 'facilitator', label: 'Facilitator', description: 'Leads and administers programs' },
  { value: 'tenant_admin', label: 'Client Admin', description: 'Full access to client tenant' },
] as const;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function ChangeRoleModal({
  open,
  onClose,
  tenantId,
  userId,
  userName,
  currentRoles,
}: ChangeRoleModalProps) {
  const currentSet = new Set(currentRoles);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(currentRoles));
  const changeRole = useChangeUserRole(tenantId);

  if (!open) return null;

  const toggleRole = (value: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        if (next.size > 1) next.delete(value); // Must keep at least one
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const unchanged = setsEqual(selectedRoles, currentSet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unchanged) {
      onClose();
      return;
    }
    try {
      await changeRole.mutateAsync({
        userId,
        roles: Array.from(selectedRoles) as (
          | 'learner'
          | 'mentor'
          | 'facilitator'
          | 'tenant_admin'
        )[],
      });
      onClose();
    } catch (err) {
      // Error is handled by mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Change Roles</h2>
        <p className="mt-1 text-sm text-gray-500">
          Change roles for <span className="font-medium">{userName}</span>
        </p>

        {currentRoles.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            Current:{' '}
            {currentRoles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRoles.has(r.value)
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedRoles.has(r.value)}
                onChange={() => toggleRole(r.value)}
                className="mt-0.5 accent-red-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{r.label}</div>
                <div className="text-xs text-gray-500">{r.description}</div>
              </div>
            </label>
          ))}

          {changeRole.error && (
            <p className="text-sm text-red-600">{(changeRole.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changeRole.isPending || unchanged}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {changeRole.isPending ? 'Saving...' : 'Save Roles'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
