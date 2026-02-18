'use client';

import { X, PenLine, LayoutTemplate } from 'lucide-react';

interface CreateProgramChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScratch: () => void;
  onTemplate: () => void;
}

export function CreateProgramChoiceModal({
  isOpen,
  onClose,
  onScratch,
  onTemplate,
}: CreateProgramChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Create a New Program</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Start from scratch */}
          <button
            onClick={() => { onClose(); onScratch(); }}
            className="group flex flex-col items-start p-5 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
              <PenLine className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="font-semibold text-gray-900 mb-1">Start from Scratch</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Build your own program from the ground up with full control.
            </p>
          </button>

          {/* Use a template */}
          <button
            onClick={() => { onClose(); onTemplate(); }}
            className="group flex flex-col items-start p-5 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
              <LayoutTemplate className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="font-semibold text-gray-900 mb-1">Use a Template</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Start from a saved template and customize it for your needs.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
