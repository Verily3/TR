'use client';

import { useState } from 'react';
import { X, Building2, CheckCircle2 } from 'lucide-react';
import { useTenants } from '@/hooks/api/useTenants';
import { useAssignProgramToClient } from '@/hooks/api/useAgencyPrograms';
import type { Program } from '@/types/programs';

interface AssignProgramModalProps {
  isOpen: boolean;
  program: Program | null;
  onClose: () => void;
}

export function AssignProgramModal({ isOpen, program, onClose }: AssignProgramModalProps) {
  const [tenantId, setTenantId] = useState('');
  const [name, setName] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assigned, setAssigned] = useState(false);
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const assignMutation = useAssignProgramToClient();

  if (!isOpen || !program) return null;

  const handleClose = () => {
    setTenantId('');
    setName('');
    setAssignError('');
    setAssigned(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setAssignError('');

    try {
      await assignMutation.mutateAsync({
        programId: program.id,
        tenantId,
        name: name.trim() || undefined,
      });
      setAssigned(true);
    } catch {
      setAssignError('Failed to assign program. Please try again.');
    }
  };

  const selectedTenant = tenants?.find((t) => t.id === tenantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={assignMutation.isPending ? undefined : handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assign to Client</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{program.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={assignMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {assigned ? (
          /* Success state */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Program Assigned!</h3>
            <p className="text-sm text-gray-500 mb-6">
              A copy of <strong>{program.name}</strong> has been created for <strong>{selectedTenant?.name}</strong>.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              This will create a copy of <strong>{program.name}</strong> in the selected client&apos;s workspace. The client can then manage and enroll participants.
            </p>

            {/* Client selector */}
            <div>
              <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Client <span className="text-red-500">*</span>
              </label>
              {tenantsLoading ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  id="clientSelect"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">Choose a client...</option>
                  {(tenants ?? []).map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional name override */}
            <div>
              <label htmlFor="assignName" className="block text-sm font-medium text-gray-700 mb-1">
                Program Name in Client Workspace
              </label>
              <input
                id="assignName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={program.name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to the original program name.</p>
            </div>

            {assignError && (
              <p className="text-sm text-red-600">{assignError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={assignMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!tenantId || assignMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign Program'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
