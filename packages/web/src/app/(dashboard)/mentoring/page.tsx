'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  MapPin,
  Video,
  FileText,
  ArrowRight,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTenants } from '@/hooks/api/useTenants';
import {
  useMentoringRelationships,
  useMentoringSessions,
  useMentoringActionItems,
  useMentoringStats,
  useCreateMentoringSession,
  useUpdateActionItem,
  type MentoringRelationship,
  type MentoringSession,
  type ActionItem,
  type CreateSessionInput,
} from '@/hooks/api/useMentoring';
import { SessionPrepModal } from '@/components/coaching/SessionPrepModal';

// ---------------------------------------------------------------------------
// Config / Labels
// ---------------------------------------------------------------------------

const sessionTypeLabels: Record<string, string> = {
  mentoring: 'Mentoring Session',
  one_on_one: '1:1 Meeting',
  check_in: 'Check-in',
  review: 'Review',
  planning: 'Planning Session',
};

const sessionStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-700' },
  prep_in_progress: { label: 'Prep in Progress', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  no_show: { label: 'No Show', bg: 'bg-red-100', text: 'text-red-700' },
};

const relationshipTypeLabels: Record<string, string> = {
  mentor: 'Mentor',
  coach: 'Coach',
  manager: 'Manager',
};

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  high: { label: 'High', bg: 'bg-red-100', text: 'text-red-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const actionStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-600' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
};

const sessionTypes = ['mentoring', 'one_on_one', 'check_in', 'review', 'planning'] as const;
const durations = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hr' },
  { value: 90, label: '1.5 hr' },
];

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function getInitials(first?: string, last?: string, fallback = 'U'): string {
  const f = (first?.[0] ?? '').toUpperCase();
  const l = (last?.[0] ?? '').toUpperCase();
  return f + l || fallback;
}

function getPersonInitials(p: { firstName?: string; lastName?: string }): string {
  return getInitials(p.firstName, p.lastName);
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isUpcomingSession(s: MentoringSession) {
  return s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'no_show';
}

// ---------------------------------------------------------------------------
// SessionCard Component
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  isMentee = false,
  onPrepClick,
}: {
  session: MentoringSession;
  isMentee?: boolean;
  onPrepClick?: () => void;
}) {
  const statusCfg = sessionStatusConfig[session.status] ?? sessionStatusConfig.scheduled;
  const typeLabel = sessionTypeLabels[session.type] ?? session.type;
  const isPast = !isUpcomingSession(session);

  return (
    <div
      className={`bg-card rounded-xl border border-border p-4 sm:p-5 hover:border-accent/30 transition-colors ${
        isPast ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-50 rounded-lg shrink-0">
            <span className="text-xs text-accent uppercase">
              {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-lg sm:text-xl font-semibold text-accent">
              {new Date(session.scheduledAt).getDate()}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sidebar-foreground font-medium">{typeLabel}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-50 text-accent flex items-center justify-center text-xs font-medium">
                  {getPersonInitials(session.mentor)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {session.mentor.firstName} {session.mentor.lastName}
                </span>
              </div>
              <span className="text-muted-foreground">&#8596;</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                  {getPersonInitials(session.mentee)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {session.mentee.firstName} {session.mentee.lastName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{session.duration} min</span>
              </div>
              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{session.location}</span>
                </div>
              )}
              {session.videoLink && (
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span>Video call</span>
                </div>
              )}
            </div>

            {session.agenda && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{session.agenda}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
          {/* Prep button / badge */}
          {onPrepClick ? (
            session.prep ? (
              <button
                onClick={onPrepClick}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1 hover:bg-green-200 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isMentee ? 'Edit Prep' : 'View Prep'}</span>
              </button>
            ) : isMentee ? (
              <button
                onClick={onPrepClick}
                className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1 hover:bg-yellow-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Start Prep</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-sm flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Awaiting Prep</span>
              </span>
            )
          ) : (
            <>
              {session.status === 'scheduled' && !session.prep && (
                <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Prep</span>
                </span>
              )}
              {session.status === 'ready' && (
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Ready</span>
                </span>
              )}
            </>
          )}
          {(session.actionItems?.length ?? 0) > 0 && (
            <div className="text-xs text-muted-foreground">
              {session.actionItems.filter((a) => a.status !== 'completed').length} pending actions
            </div>
          )}
          <ArrowRight className="w-5 h-5 text-accent mt-2" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenteeCard (for mentor view)
// ---------------------------------------------------------------------------

function MenteeCard({ relationship }: { relationship: MentoringRelationship }) {
  const typeLabel = relationshipTypeLabels[relationship.type] ?? relationship.type;
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Paused' },
    ended: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Ended' },
  };
  const statusCfg = statusColors[relationship.status] ?? statusColors.active;

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
          {getPersonInitials(relationship.mentee)}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sidebar-foreground truncate">
            {relationship.mentee.firstName} {relationship.mentee.lastName}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {relationship.mentee.title ?? relationship.mentee.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
        >
          {statusCfg.label}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {typeLabel}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        Since {formatDateShort(relationship.startedAt)}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">View details</span>
        <ArrowRight className="w-4 h-4 text-accent" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionItemRow
// ---------------------------------------------------------------------------

function ActionItemRow({ item, tenantId }: { item: ActionItem; tenantId: string }) {
  const updateItem = useUpdateActionItem(tenantId);
  const priorityCfg = priorityConfig[item.priority] ?? priorityConfig.medium;
  const statusCfg = actionStatusConfig[item.status] ?? actionStatusConfig.pending;
  const isOverdue =
    item.dueDate && item.status !== 'completed' && new Date(item.dueDate) < new Date();

  const handleToggleComplete = () => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    updateItem.mutate({ itemId: item.id, input: { status: newStatus } });
  };

  return (
    <div
      className={`flex items-start gap-3 py-3 border-b border-border last:border-0 ${item.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <button
        onClick={handleToggleComplete}
        disabled={updateItem.isPending}
        className="mt-0.5 shrink-0"
      >
        {item.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-border hover:border-accent transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`font-medium text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-sidebar-foreground'}`}
          >
            {item.title}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${priorityCfg.bg} ${priorityCfg.text}`}
            >
              {priorityCfg.label}
            </span>
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {item.ownerName && (
            <span className="text-xs text-muted-foreground">{item.ownerName}</span>
          )}
          {item.dueDate && (
            <span
              className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}
            >
              <Calendar className="w-3 h-3" />
              {formatDateShort(item.dueDate)}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NewSessionModal
// ---------------------------------------------------------------------------

function NewSessionModal({
  isOpen,
  onClose,
  relationships,
  tenantId,
}: {
  isOpen: boolean;
  onClose: () => void;
  relationships: MentoringRelationship[];
  tenantId: string;
}) {
  const createSession = useCreateMentoringSession(tenantId);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [sessionType, setSessionType] = useState<(typeof sessionTypes)[number]>('mentoring');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [locationType, setLocationType] = useState<'in_person' | 'video'>('video');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedRelationship || !date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const input: CreateSessionInput = {
      relationshipId: selectedRelationship,
      type: sessionType,
      scheduledAt,
      duration,
      ...(locationType === 'in_person' ? { location } : { videoLink }),
      ...(agenda ? { agenda } : {}),
    };
    await createSession.mutateAsync(input);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl mx-4 shadow-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Schedule New Session</h2>
            <p className="text-sm text-muted-foreground">Set up a mentoring session</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Relationship <span className="text-accent">*</span>
            </label>
            <select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a relationship...</option>
              {relationships.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.mentor.firstName} {rel.mentor.lastName} &rarr; {rel.mentee.firstName}{' '}
                  {rel.mentee.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Session Type <span className="text-accent">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sessionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    sessionType === type
                      ? 'border-accent bg-red-50 text-sidebar-foreground'
                      : 'border-border text-muted-foreground hover:border-accent/50'
                  }`}
                >
                  {sessionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Time <span className="text-accent">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    duration === d.value
                      ? 'border-accent bg-red-50 text-sidebar-foreground'
                      : 'border-border text-muted-foreground hover:border-accent/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Meeting Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLocationType('video')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === 'video'
                    ? 'border-accent bg-red-50'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <Video className="w-5 h-5 text-accent mb-2" />
                <div className="font-medium text-sidebar-foreground text-sm">Video Call</div>
                <div className="text-xs text-muted-foreground">Meet online</div>
              </button>
              <button
                type="button"
                onClick={() => setLocationType('in_person')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === 'in_person'
                    ? 'border-accent bg-red-50'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <MapPin className="w-5 h-5 text-accent mb-2" />
                <div className="font-medium text-sidebar-foreground text-sm">In Person</div>
                <div className="text-xs text-muted-foreground">Meet in office</div>
              </button>
            </div>
          </div>

          {locationType === 'video' ? (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Video Link
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Conference Room A"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Agenda (optional)
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Topics to discuss..."
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRelationship || !date || !time || createSession.isPending}
            className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createSession.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  value,
  label,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor ?? 'text-accent'}`} />
        <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">{value}</span>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  message,
  action,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-8">
      <div className="text-center">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">{message}</p>
        {action && onAction && (
          <button
            onClick={onAction}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor View (for roleSlug === 'mentor')
// ---------------------------------------------------------------------------

type MentorTab = 'mentees' | 'sessions' | 'action-items';

function MentorView({
  tenantId,
  userId,
  showNewSessionModal,
  setShowNewSessionModal,
}: {
  tenantId: string;
  userId: string;
  showNewSessionModal: boolean;
  setShowNewSessionModal: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<MentorTab>('mentees');
  const [prepSession, setPrepSession] = useState<MentoringSession | null>(null);

  const { data: stats, isLoading: statsLoading } = useMentoringStats(tenantId);
  const { data: relationships = [], isLoading: relLoading } = useMentoringRelationships(tenantId);
  const { data: sessions = [], isLoading: sessionsLoading } = useMentoringSessions(tenantId);
  const { data: actionItems = [], isLoading: aiLoading } = useMentoringActionItems(tenantId);

  const upcomingSessions = sessions.filter(isUpcomingSession);
  const pastSessions = sessions.filter((s) => !isUpcomingSession(s));
  const openActionItems = actionItems.filter((a) => a.status !== 'completed');

  const tabs: { id: MentorTab; label: string }[] = [
    { id: 'mentees', label: 'My Mentees' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'action-items', label: 'Action Items' },
  ];

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <StatCard icon={Users} value={stats?.activeRelationships ?? 0} label="Active Mentees" />
            <StatCard
              icon={Calendar}
              value={stats?.upcomingSessions ?? 0}
              label="Upcoming Sessions"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={Clock}
              value={openActionItems.length}
              label="Open Action Items"
              iconColor="text-yellow-600"
            />
            <StatCard
              icon={CheckCircle2}
              value={stats?.completedSessions ?? 0}
              label="Completed Sessions"
              iconColor="text-green-600"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-fit mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-sidebar-foreground hover:bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: My Mentees */}
      {activeTab === 'mentees' && (
        <>
          {relLoading ? (
            <LoadingSpinner />
          ) : relationships.length === 0 ? (
            <EmptyState icon={Users} message="You have no active mentee relationships." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relationships.map((rel) => (
                <MenteeCard key={rel.id} relationship={rel} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {sessionsLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div>
                <h3 className="text-sidebar-foreground font-medium mb-3">
                  Upcoming Sessions ({upcomingSessions.length})
                </h3>
                {upcomingSessions.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    message="No upcoming sessions scheduled."
                    action="Schedule a session"
                    onAction={() => setShowNewSessionModal(true)}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isMentee={userId === s.mentee.id}
                        onPrepClick={() => setPrepSession(s)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {pastSessions.length > 0 && (
                <div>
                  <h3 className="text-sidebar-foreground font-medium mb-3">
                    Past Sessions ({pastSessions.length})
                  </h3>
                  <div className="space-y-3">
                    {pastSessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isMentee={userId === s.mentee.id}
                        onPrepClick={s.prep ? () => setPrepSession(s) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Action Items */}
      {activeTab === 'action-items' && (
        <>
          {aiLoading ? (
            <LoadingSpinner />
          ) : actionItems.length === 0 ? (
            <EmptyState icon={CheckCircle2} message="No action items found." />
          ) : (
            <div className="bg-card rounded-xl border border-border p-5">
              {actionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} tenantId={tenantId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        relationships={relationships}
        tenantId={tenantId}
      />
      {prepSession && (
        <SessionPrepModal
          session={prepSession}
          tenantId={tenantId}
          isMentee={userId === prepSession.mentee.id}
          onClose={() => setPrepSession(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Facilitator View (for roleSlug === 'facilitator' or tenant_admin)
// ---------------------------------------------------------------------------

type FacilitatorTab = 'overview' | 'mentors' | 'sessions' | 'action-items';

function ExpandableMentorRow({
  mentorId,
  relationships,
  sessions,
  actionItems,
}: {
  mentorId: string;
  relationships: MentoringRelationship[];
  sessions: MentoringSession[];
  actionItems: ActionItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const mentorRels = relationships.filter((r) => r.mentorId === mentorId);
  const mentor = mentorRels[0]?.mentor;
  if (!mentor) return null;

  const mentorSessions = sessions.filter((s) => s.mentor.id === mentorId);
  const upcomingCount = mentorSessions.filter(isUpcomingSession).length;
  const openItems = actionItems.filter(
    (a) => a.ownerId === mentorId && a.status !== 'completed'
  ).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-accent flex items-center justify-center text-sm font-medium">
            {getPersonInitials(mentor)}
          </div>
          <div>
            <div className="font-medium text-sidebar-foreground">
              {mentor.firstName} {mentor.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{mentor.title ?? mentor.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 mr-2">
          <div className="text-center hidden sm:block">
            <div className="text-sm font-medium text-sidebar-foreground">{mentorRels.length}</div>
            <div className="text-xs text-muted-foreground">Mentees</div>
          </div>
          <div className="text-center hidden sm:block">
            <div className="text-sm font-medium text-sidebar-foreground">{upcomingCount}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center hidden sm:block">
            <div className="text-sm font-medium text-sidebar-foreground">{openItems}</div>
            <div className="text-xs text-muted-foreground">Open Actions</div>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 bg-muted/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mentorRels.map((rel) => (
            <MenteeCard key={rel.id} relationship={rel} />
          ))}
        </div>
      )}
    </div>
  );
}

function FacilitatorView({
  tenantId,
  userId,
  showNewSessionModal,
  setShowNewSessionModal,
}: {
  tenantId: string;
  userId: string;
  showNewSessionModal: boolean;
  setShowNewSessionModal: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<FacilitatorTab>('overview');
  const [prepSession, setPrepSession] = useState<MentoringSession | null>(null);

  const { data: stats, isLoading: statsLoading } = useMentoringStats(tenantId);
  const { data: relationships = [], isLoading: relLoading } = useMentoringRelationships(tenantId);
  const { data: sessions = [], isLoading: sessionsLoading } = useMentoringSessions(tenantId);
  const { data: actionItems = [], isLoading: aiLoading } = useMentoringActionItems(tenantId);

  const uniqueMentorIds = [...new Set(relationships.map((r) => r.mentorId))];
  const upcomingSessions = sessions.filter(isUpcomingSession);
  const pastSessions = sessions.filter((s) => !isUpcomingSession(s));
  const overdueItems = actionItems.filter(
    (a) => a.dueDate && a.status !== 'completed' && new Date(a.dueDate) < new Date()
  );

  const tabs: { id: FacilitatorTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'mentors', label: 'Mentors' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'action-items', label: 'Action Items' },
  ];

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <StatCard icon={Users} value={uniqueMentorIds.length} label="Total Mentors" />
            <StatCard
              icon={Users}
              value={relationships.length}
              label="Total Mentees"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={Calendar}
              value={stats?.upcomingSessions ?? 0}
              label="Upcoming Sessions"
              iconColor="text-green-600"
            />
            <StatCard
              icon={AlertCircle}
              value={overdueItems.length}
              label="Overdue Actions"
              iconColor="text-red-600"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-fit mb-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-sidebar-foreground hover:bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {relLoading ? (
            <LoadingSpinner />
          ) : relationships.length === 0 ? (
            <EmptyState icon={Users} message="No mentoring relationships found." />
          ) : (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-medium text-sidebar-foreground mb-4">
                All Mentor-Mentee Pairs ({relationships.length})
              </h3>
              <div className="space-y-3">
                {relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-accent flex items-center justify-center text-xs font-medium border-2 border-card">
                        {getPersonInitials(rel.mentor)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium border-2 border-card">
                        {getPersonInitials(rel.mentee)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-sidebar-foreground">
                        {rel.mentor.firstName} {rel.mentor.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground mx-2">→</span>
                      <span className="text-sm text-sidebar-foreground">
                        {rel.mentee.firstName} {rel.mentee.lastName}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rel.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rel.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Mentors */}
      {activeTab === 'mentors' && (
        <>
          {relLoading ? (
            <LoadingSpinner />
          ) : uniqueMentorIds.length === 0 ? (
            <EmptyState icon={Users} message="No mentors found." />
          ) : (
            <div className="space-y-3">
              {uniqueMentorIds.map((mentorId) => (
                <ExpandableMentorRow
                  key={mentorId}
                  mentorId={mentorId}
                  relationships={relationships}
                  sessions={sessions}
                  actionItems={actionItems}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {sessionsLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div>
                <h3 className="text-sidebar-foreground font-medium mb-3">
                  Upcoming Sessions ({upcomingSessions.length})
                </h3>
                {upcomingSessions.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    message="No upcoming sessions."
                    action="Schedule a session"
                    onAction={() => setShowNewSessionModal(true)}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isMentee={userId === s.mentee.id}
                        onPrepClick={() => setPrepSession(s)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {pastSessions.length > 0 && (
                <div>
                  <h3 className="text-sidebar-foreground font-medium mb-3">
                    Past Sessions ({pastSessions.length})
                  </h3>
                  <div className="space-y-3">
                    {pastSessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isMentee={userId === s.mentee.id}
                        onPrepClick={s.prep ? () => setPrepSession(s) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Action Items */}
      {activeTab === 'action-items' && (
        <>
          {aiLoading ? (
            <LoadingSpinner />
          ) : actionItems.length === 0 ? (
            <EmptyState icon={CheckCircle2} message="No action items found." />
          ) : (
            <div className="bg-card rounded-xl border border-border p-5">
              {actionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} tenantId={tenantId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        relationships={relationships}
        tenantId={tenantId}
      />
      {prepSession && (
        <SessionPrepModal
          session={prepSession}
          tenantId={tenantId}
          isMentee={userId === prepSession.mentee.id}
          onClose={() => setPrepSession(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Mentoring Page
// ---------------------------------------------------------------------------

export default function MentoringPage() {
  const { user } = useAuth();
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const isAgencyUser = !!(user?.agencyId && !user?.tenantId);
  const { data: tenants } = useTenants();

  // Auto-select first tenant for agency users
  useEffect(() => {
    if (isAgencyUser && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isAgencyUser, tenants, selectedTenantId]);

  const tenantId = isAgencyUser ? selectedTenantId : (user?.tenantId ?? null);
  const roleSlug = user?.roleSlug;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 sm:mb-2">
            Mentoring
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage mentoring relationships, sessions, and development conversations
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAgencyUser && tenants && tenants.length > 0 && (
            <select
              value={selectedTenantId || ''}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm text-sidebar-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </button>
        </div>
      </header>

      {tenantId ? (
        roleSlug === 'mentor' ? (
          <MentorView
            tenantId={tenantId}
            userId={user?.id ?? ''}
            showNewSessionModal={showNewSessionModal}
            setShowNewSessionModal={setShowNewSessionModal}
          />
        ) : (
          <FacilitatorView
            tenantId={tenantId}
            userId={user?.id ?? ''}
            showNewSessionModal={showNewSessionModal}
            setShowNewSessionModal={setShowNewSessionModal}
          />
        )
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          {isAgencyUser ? 'Loading tenants...' : 'No tenant context.'}
        </div>
      )}
    </div>
  );
}
