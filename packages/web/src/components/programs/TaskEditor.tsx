'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  CheckSquare,
  FileText,
  Upload,
  Target,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import type {
  LessonTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskResponseType,
  ApprovalRequired,
} from '@/types/programs';

const RESPONSE_TYPE_CONFIG: Record<TaskResponseType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  completion_click: { icon: CheckSquare, label: 'Completion Click', color: 'text-green-600' },
  text: { icon: FileText, label: 'Text Response', color: 'text-blue-600' },
  file_upload: { icon: Upload, label: 'File Upload', color: 'text-orange-600' },
  goal: { icon: Target, label: 'Goal Setting', color: 'text-yellow-600' },
  discussion: { icon: MessageSquare, label: 'Discussion', color: 'text-purple-600' },
};

interface TaskEditorProps {
  tasks: LessonTask[];
  onCreateTask: (input: CreateTaskInput) => void;
  onUpdateTask: (taskId: string, input: UpdateTaskInput) => void;
  onDeleteTask: (taskId: string) => void;
  isCreating?: boolean;
}

function TaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: LessonTask;
  onUpdate: (input: UpdateTaskInput) => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [responseType, setResponseType] = useState<TaskResponseType>(task.responseType);
  const [approvalRequired, setApprovalRequired] = useState<ApprovalRequired>(task.approvalRequired);
  const [points, setPoints] = useState<number | ''>(task.points || 0);
  const [dueDaysOffset, setDueDaysOffset] = useState<number | ''>(task.dueDaysOffset ?? '');

  const typeConfig = RESPONSE_TYPE_CONFIG[task.responseType];
  const TypeIcon = typeConfig.icon;

  const handleSave = () => {
    onUpdate({
      title: title.trim() || task.title,
      description: description.trim() || undefined,
      responseType,
      approvalRequired,
      points: points === '' ? 0 : Number(points),
      dueDaysOffset: dueDaysOffset === '' ? undefined : Number(dueDaysOffset),
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Task Header (always visible) */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab shrink-0" />
        <TypeIcon className={`w-4 h-4 shrink-0 ${typeConfig.color}`} />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() !== task.title) handleSave();
          }}
          className="flex-1 text-sm font-medium text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
          placeholder="Task title..."
        />
        <span className="text-xs text-gray-400 shrink-0">{task.points} pts</span>
        {task.approvalRequired !== 'none' && (
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
          {/* Response Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Response Type</label>
            <select
              value={responseType}
              onChange={(e) => setResponseType(e.target.value as TaskResponseType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            >
              {Object.entries(RESPONSE_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* Approval Required */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Requires Approval</label>
            <select
              value={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.value as ApprovalRequired)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="none">None</option>
              <option value="mentor">Mentor</option>
              <option value="facilitator">Facilitator</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Points */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                min={0}
              />
            </div>
            {/* Due Days Offset */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due (days after enrollment)</label>
              <input
                type="number"
                value={dueDaysOffset}
                onChange={(e) => setDueDaysOffset(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                min={0}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
              placeholder="Describe what the learner needs to do..."
            />
          </div>

          {/* Save / Delete */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                if (!confirm('Delete this task?')) return;
                onDelete();
              }}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
            >
              Save Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskEditor({ tasks, onCreateTask, onUpdateTask, onDeleteTask, isCreating }: TaskEditorProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  const handleAddTask = () => {
    onCreateTask({
      title: 'New Task',
      responseType: 'completion_click',
      approvalRequired: 'none',
      points: 0,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {tasks.length === 0
              ? 'No tasks. Learners use the standard Mark Complete button.'
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} — learners must complete all tasks to finish this lesson.`}
          </p>
        </div>
        <button
          onClick={handleAddTask}
          disabled={isCreating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          {isCreating ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      {sortedTasks.length > 0 && (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={(input) => onUpdateTask(task.id, input)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
