'use client';

import { useState } from 'react';
import { useCreateTenant } from '@/hooks/api/useTenants';

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTenantModal({ open, onClose }: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [usersLimit, setUsersLimit] = useState(50);
  const createTenant = useCreateTenant();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTenant.mutateAsync({
        name,
        industry: industry || undefined,
        usersLimit,
      });
      setName('');
      setIndustry('');
      setUsersLimit(50);
      onClose();
    } catch (err) {
      // Error is handled by mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
        <p className="mt-1 text-sm text-gray-500">Create a new client organization.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="e.g., TechCorp Industries"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="e.g., Technology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User Limit</label>
            <input
              type="number"
              value={usersLimit}
              onChange={(e) => setUsersLimit(Number(e.target.value))}
              min={1}
              max={10000}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>

          {createTenant.error && (
            <p className="text-sm text-red-600">{(createTenant.error as Error).message}</p>
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
              disabled={createTenant.isPending || !name}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {createTenant.isPending ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
