'use client';

import { useState } from 'react';
import { X, Search, BookOpen, LayoutTemplate } from 'lucide-react';
import { useAgencyProgramTemplates } from '@/hooks/api/useAgencyPrograms';
import type { Program } from '@/types/programs';

interface TemplateBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Program) => void;
}

export function TemplateBrowserModal({
  isOpen,
  onClose,
  onSelect,
}: TemplateBrowserModalProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAgencyProgramTemplates();
  const templates = data?.programs ?? [];

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select a template to start your new program</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <LayoutTemplate className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {templates.length === 0 ? 'No templates yet' : 'No templates match your search'}
              </p>
              {templates.length === 0 && (
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Mark a program as a template from the Program Builder to start building your template library.
                </p>
              )}
            </div>
          ) : (
            filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors">
                  <BookOpen className="w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{template.name}</div>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {(template.moduleCount ?? 0) > 0 && (
                      <span>{template.moduleCount} module{template.moduleCount !== 1 ? 's' : ''}</span>
                    )}
                    {(template.lessonCount ?? 0) > 0 && (
                      <span>{template.lessonCount} lesson{template.lessonCount !== 1 ? 's' : ''}</span>
                    )}
                    <span className="capitalize">{template.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                  Use template →
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
