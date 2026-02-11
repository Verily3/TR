'use client';

import { useState } from 'react';
import { AlertTriangle, LogIn, X } from 'lucide-react';
import { useStartImpersonation } from '@/hooks/api/useImpersonate';

interface TargetUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ImpersonateUserModalProps {
  open: boolean;
  onClose: () => void;
  targetUser: TargetUser;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export function ImpersonateUserModal({ open, onClose, targetUser }: ImpersonateUserModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);
  const startImpersonation = useStartImpersonation();

  if (!open) return null;

  const targetName = `${targetUser.firstName} ${targetUser.lastName}`.trim() || targetUser.email;

  const handleSubmit = () => {
    startImpersonation.mutate({
      targetUserId: targetUser.id,
      reason: reason.trim() || undefined,
      durationMinutes: duration,
    });
  };

  const handleClose = () => {
    if (startImpersonation.isPending) return;
    setReason('');
    setDuration(60);
    startImpersonation.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Login as User</h3>
          <button
            onClick={handleClose}
            disabled={startImpersonation.isPending}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            You will see the platform exactly as <strong>{targetName}</strong> sees it.
            All actions during impersonation are logged for audit purposes.
          </div>
        </div>

        {/* Target user info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium">
            {(targetUser.firstName?.[0] || '').toUpperCase()}
            {(targetUser.lastName?.[0] || '').toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{targetName}</div>
            <div className="text-sm text-gray-500">{targetUser.email}</div>
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {startImpersonation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {startImpersonation.error?.message || 'Failed to start impersonation. Please try again.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={startImpersonation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={startImpersonation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {startImpersonation.isPending ? 'Switching...' : `Login as ${targetUser.firstName || 'User'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
