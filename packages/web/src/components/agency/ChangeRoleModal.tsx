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
  currentRole: string | null;
}

const ROLES = [
  { value: 'learner', label: 'Learner', description: 'Program participant' },
  { value: 'mentor', label: 'Mentor', description: 'Guides and supports assigned learners' },
  { value: 'facilitator', label: 'Facilitator', description: 'Leads and administers programs' },
  { value: 'tenant_admin', label: 'Client Admin', description: 'Full access to client tenant' },
] as const;

export function ChangeRoleModal({ open, onClose, tenantId, userId, userName, currentRole }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole || 'learner');
  const changeRole = useChangeUserRole(tenantId);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === currentRole) {
      onClose();
      return;
    }
    try {
      await changeRole.mutateAsync({
        userId,
        role: selectedRole as 'learner' | 'mentor' | 'facilitator' | 'tenant_admin',
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
        <h2 className="text-lg font-semibold text-gray-900">Change Role</h2>
        <p className="mt-1 text-sm text-gray-500">
          Change role for <span className="font-medium">{userName}</span>
        </p>

        {currentRole && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            Current role: <RoleBadge role={currentRole} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRole === r.value
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={selectedRole === r.value}
                onChange={(e) => setSelectedRole(e.target.value)}
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
              disabled={changeRole.isPending || selectedRole === currentRole}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {changeRole.isPending ? 'Changing...' : 'Change Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
