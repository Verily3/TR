'use client';

import { X, ClipboardList, LayoutTemplate } from 'lucide-react';

interface CreateAssessmentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user wants to create a new assessment (both paths lead here) */
  onCreate: () => void;
}

/**
 * Entry point for creating a new assessment.
 * Both options proceed to the same multi-step wizard — the choice modal sets user intent
 * and keeps the UX consistent with the Program Builder's template workflow.
 */
export function CreateAssessmentChoiceModal({
  isOpen,
  onClose,
  onCreate,
}: CreateAssessmentChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Create a New Assessment</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Use a template */}
          <button
            onClick={() => { onClose(); onCreate(); }}
            className="group flex flex-col items-start p-5 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
              <LayoutTemplate className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="font-semibold text-gray-900 mb-1">Use a Template</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Start from an agency-approved assessment template with pre-built competencies.
            </p>
          </button>

          {/* Custom / scratch */}
          <button
            onClick={() => { onClose(); onCreate(); }}
            className="group flex flex-col items-start p-5 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
              <ClipboardList className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="font-semibold text-gray-900 mb-1">Custom Assessment</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Select or skip a template to build a tailored assessment for a specific need.
            </p>
          </button>
        </div>

        <p className="pb-5 px-6 text-xs text-gray-400 text-center">
          Assessment templates are managed by your agency administrator in the Agency Portal.
        </p>
      </div>
    </div>
  );
}
