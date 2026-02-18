'use client';

import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import type { Program } from '@/types/programs';

interface UseTemplateModalProps {
  isOpen: boolean;
  template: Program | null;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isLoading?: boolean;
}

export function UseTemplateModal({
  isOpen,
  template,
  onClose,
  onConfirm,
  isLoading = false,
}: UseTemplateModalProps) {
  const [name, setName] = useState('');

  if (!isOpen || !template) return null;

  const defaultName = `Copy of ${template.name}`;
  const displayName = name || defaultName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(displayName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!isLoading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Use Template</h2>
              <p className="text-xs text-gray-500">Based on: {template.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="programName" className="block text-sm font-medium text-gray-700 mb-1">
              Program Name
            </label>
            <input
              id="programName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to use the default name.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
