'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  FileText,
  Upload,
  Target,
  MessageSquare,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import type { LessonTask, TaskWithProgress, TaskResponseType } from '@/types/programs';

const TASK_ICONS: Record<TaskResponseType, typeof CheckSquare> = {
  completion_click: CheckSquare,
  text: FileText,
  file_upload: Upload,
  goal: Target,
  discussion: MessageSquare,
};

interface TaskListProps {
  tasks: LessonTask[];
  taskProgress?: TaskWithProgress[];
  onCompleteTask?: (taskId: string) => void;
  onSubmitTask?: (taskId: string) => void;
  isCompleting?: boolean;
}

export function TaskList({
  tasks,
  taskProgress,
  onCompleteTask,
  isCompleting,
}: TaskListProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  const progressMap = new Map<string, TaskWithProgress>();
  taskProgress?.forEach((tp) => progressMap.set(tp.id, tp));

  const completedCount = sortedTasks.filter(
    (t) => progressMap.get(t.id)?.status === 'completed'
  ).length;

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-sidebar-foreground">
          Tasks ({completedCount}/{sortedTasks.length} completed)
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${sortedTasks.length > 0 ? (completedCount / sortedTasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {sortedTasks.length > 0 ? Math.round((completedCount / sortedTasks.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Task Items */}
      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            progress={progressMap.get(task.id)}
            onComplete={onCompleteTask}
            isCompleting={isCompleting}
          />
        ))}
      </div>

      {/* Footer message */}
      {completedCount < sortedTasks.length && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Complete all tasks to finish this lesson.
        </p>
      )}
    </div>
  );
}

function TaskItem({
  task,
  progress,
  onComplete,
  isCompleting,
}: {
  task: LessonTask;
  progress?: TaskWithProgress;
  onComplete?: (taskId: string) => void;
  isCompleting?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = progress?.status || 'not_started';
  const isCompleted = status === 'completed';
  const Icon = TASK_ICONS[task.responseType] || CheckSquare;

  const needsApproval = task.approvalRequired !== 'none';

  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        isCompleted
          ? 'border-green-200 bg-green-50/50'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5 shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : status === 'in_progress' ? (
            <Clock className="w-5 h-5 text-amber-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 shrink-0 ${isCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
            <h4 className={`text-sm font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-sidebar-foreground'}`}>
              {task.title}
            </h4>
          </div>

          {task.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground hover:text-sidebar-foreground mt-1 transition-colors focus:outline-none"
            >
              {expanded ? 'Hide details' : 'Show details'}
            </button>
          )}

          {expanded && task.description && (
            <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2">
            {task.points > 0 && (
              <span className="text-xs text-muted-foreground">{task.points} pts</span>
            )}
            {needsApproval && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <ShieldCheck className="w-3 h-3" />
                {task.approvalRequired === 'both' ? 'Mentor & Facilitator' : task.approvalRequired} approval
              </span>
            )}
            {task.dueDaysOffset != null && (
              <span className="text-xs text-muted-foreground">
                Due {task.dueDaysOffset} days after enrollment
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isCompleted ? (
            <span className="text-xs font-medium text-green-600">Done</span>
          ) : task.responseType === 'completion_click' && !needsApproval ? (
            <button
              onClick={() => onComplete?.(task.id)}
              disabled={isCompleting}
              className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
            >
              {isCompleting ? 'Completing...' : 'Mark Done'}
            </button>
          ) : needsApproval && status === 'in_progress' ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Pending Review
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">To do</span>
          )}
        </div>
      </div>
    </div>
  );
}
