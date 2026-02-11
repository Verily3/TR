'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RelationshipType = 'mentor' | 'manager';
type SessionType = 'mentoring' | 'one_on_one' | 'check_in' | 'review' | 'planning';
type SessionStatus = 'scheduled' | 'prep_in_progress' | 'ready' | 'completed' | 'cancelled' | 'no_show';
type ActionItemPriority = 'low' | 'medium' | 'high';
type ActionItemStatus = 'pending' | 'in_progress' | 'completed';

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface MentoringRelationship {
  id: string;
  mentor: Person;
  mentee: Person;
  type: RelationshipType;
  startDate: string;
  meetingFrequency: string;
  nextSession?: string;
  totalSessions: number;
  status: 'active' | 'paused' | 'ended';
}

interface SessionPrep {
  id: string;
  sessionId: string;
  wins: string[];
  challenges: string[];
  topicsToDiscuss: string[];
  submittedAt?: string;
}

interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

interface ActionItem {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  completedAt?: string;
}

interface MentoringSession {
  id: string;
  relationshipId: string;
  mentor: Person;
  mentee: Person;
  type: SessionType;
  status: SessionStatus;
  scheduledAt: string;
  duration: number;
  location?: string;
  videoLink?: string;
  agenda?: string;
  prep?: SessionPrep;
  notes: SessionNote[];
  actionItems: ActionItem[];
}

interface MentoringStats {
  totalRelationships: number;
  activeRelationships: number;
  upcomingSessions: number;
  completedSessions: number;
  pendingActionItems: number;
  overdueActionItems: number;
}

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
  manager: 'Manager',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const people: Person[] = [
  { id: 'p1', name: 'John Doe', email: 'john.doe@company.com', role: 'Senior Manager' },
  { id: 'p2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Executive Mentor' },
  { id: 'p3', name: 'Michael Chen', email: 'michael.chen@company.com', role: 'Director' },
  { id: 'p4', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Team Lead' },
  { id: 'p5', name: 'James Wilson', email: 'james.wilson@company.com', role: 'VP Operations' },
];

const mockRelationships: MentoringRelationship[] = [
  {
    id: 'r1',
    mentor: people[1],
    mentee: people[0],
    type: 'mentor',
    startDate: '2024-09-01',
    meetingFrequency: 'Bi-weekly',
    nextSession: '2025-02-05',
    totalSessions: 12,
    status: 'active',
  },
  {
    id: 'r2',
    mentor: people[4],
    mentee: people[0],
    type: 'mentor',
    startDate: '2024-06-15',
    meetingFrequency: 'Monthly',
    nextSession: '2025-02-15',
    totalSessions: 8,
    status: 'active',
  },
  {
    id: 'r3',
    mentor: people[2],
    mentee: people[3],
    type: 'manager',
    startDate: '2024-01-10',
    meetingFrequency: 'Weekly',
    nextSession: '2025-02-03',
    totalSessions: 45,
    status: 'active',
  },
];

const mockSessionPrep: SessionPrep = {
  id: 'prep1',
  sessionId: 's1',
  wins: [
    'Successfully led the Q4 project review meeting',
    'Received positive feedback from stakeholders on the new process',
    'Team engagement scores improved by 15%',
  ],
  challenges: [
    'Struggling with time management across multiple projects',
    'Difficult conversation with underperforming team member',
  ],
  topicsToDiscuss: [
    'Strategies for better delegation',
    'How to have effective performance conversations',
    'Career development planning for Q2',
  ],
  submittedAt: '2025-02-04T10:30:00Z',
};

const mockActionItems: ActionItem[] = [
  {
    id: 'a1',
    sessionId: 's2',
    title: 'Create delegation framework document',
    description: 'Document the delegation process and share with the team',
    ownerId: 'p1',
    ownerName: 'John Doe',
    dueDate: '2025-02-10',
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: 'a2',
    sessionId: 's2',
    title: 'Schedule 1:1s with direct reports',
    description: 'Set up recurring 1:1 meetings with each team member',
    ownerId: 'p1',
    ownerName: 'John Doe',
    dueDate: '2025-02-07',
    priority: 'medium',
    status: 'completed',
    completedAt: '2025-02-01T09:00:00Z',
  },
  {
    id: 'a3',
    sessionId: 's2',
    title: 'Review leadership book chapters 5-7',
    description: 'Read and take notes on assigned chapters',
    ownerId: 'p1',
    ownerName: 'John Doe',
    dueDate: '2025-02-05',
    priority: 'low',
    status: 'pending',
  },
  {
    id: 'a4',
    sessionId: 's1',
    title: 'Practice feedback conversation',
    description: 'Role-play the upcoming performance conversation',
    ownerId: 'p1',
    ownerName: 'John Doe',
    dueDate: '2025-02-04',
    priority: 'high',
    status: 'pending',
  },
];

const mockSessionNotes: SessionNote[] = [
  {
    id: 'n1',
    sessionId: 's2',
    authorId: 'p2',
    authorName: 'Sarah Johnson',
    content:
      'John showed great progress in applying the feedback framework we discussed. He mentioned the team responded well to the new approach. We identified three key areas to focus on: delegation, strategic thinking, and stakeholder management.',
    isPrivate: false,
    createdAt: '2025-01-22T15:30:00Z',
  },
  {
    id: 'n2',
    sessionId: 's2',
    authorId: 'p2',
    authorName: 'Sarah Johnson',
    content:
      'Private note: John seems hesitant about the upcoming leadership transition. May need to address confidence issues in future sessions.',
    isPrivate: true,
    createdAt: '2025-01-22T15:45:00Z',
  },
];

const mockSessions: MentoringSession[] = [
  {
    id: 's1',
    relationshipId: 'r1',
    mentor: people[1],
    mentee: people[0],
    type: 'mentoring',
    status: 'ready',
    scheduledAt: '2025-02-05T14:00:00Z',
    duration: 60,
    location: 'Conference Room A',
    videoLink: 'https://zoom.us/j/123456789',
    agenda: 'Review progress on delegation, discuss performance conversation approach',
    prep: mockSessionPrep,
    notes: [],
    actionItems: [mockActionItems[3]],
  },
  {
    id: 's2',
    relationshipId: 'r1',
    mentor: people[1],
    mentee: people[0],
    type: 'mentoring',
    status: 'completed',
    scheduledAt: '2025-01-22T14:00:00Z',
    duration: 60,
    location: 'Conference Room A',
    notes: mockSessionNotes,
    actionItems: [mockActionItems[0], mockActionItems[1], mockActionItems[2]],
  },
  {
    id: 's3',
    relationshipId: 'r2',
    mentor: people[4],
    mentee: people[0],
    type: 'one_on_one',
    status: 'scheduled',
    scheduledAt: '2025-02-15T10:00:00Z',
    duration: 45,
    videoLink: 'https://teams.microsoft.com/l/meetup-join/123',
    agenda: 'Quarterly career development review',
    notes: [],
    actionItems: [],
  },
  {
    id: 's4',
    relationshipId: 'r3',
    mentor: people[2],
    mentee: people[3],
    type: 'check_in',
    status: 'prep_in_progress',
    scheduledAt: '2025-02-03T09:00:00Z',
    duration: 30,
    location: "Michael's Office",
    notes: [],
    actionItems: [],
  },
];

const mockStats: MentoringStats = {
  totalRelationships: 3,
  activeRelationships: 3,
  upcomingSessions: 3,
  completedSessions: 24,
  pendingActionItems: 3,
  overdueActionItems: 1,
};

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// SessionCard Component
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  onViewSession,
}: {
  session: MentoringSession;
  onViewSession?: (sessionId: string) => void;
}) {
  const statusCfg = sessionStatusConfig[session.status];
  const typeLabel = sessionTypeLabels[session.type];

  const isPast =
    session.status === 'completed' || session.status === 'cancelled' || session.status === 'no_show';
  const needsPrep = session.status === 'scheduled' && !session.prep;
  const prepInProgress = session.status === 'prep_in_progress';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:border-red-600/30 transition-colors cursor-pointer ${
        isPast ? 'opacity-75' : ''
      }`}
      onClick={() => onViewSession?.(session.id)}
    >
      <div className="flex items-start justify-between">
        {/* Left: Session info */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-50 rounded-lg shrink-0">
            <span className="text-xs text-red-600 uppercase">
              {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-lg sm:text-xl font-semibold text-red-600">
              {new Date(session.scheduledAt).getDate()}
            </span>
          </div>

          {/* Session details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-gray-900 font-medium">{typeLabel}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs">
                  {getInitials(session.mentor.name)}
                </div>
                <span className="text-sm text-gray-500">{session.mentor.name}</span>
              </div>
              <span className="text-gray-500">&#8596;</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                  {getInitials(session.mentee.name)}
                </div>
                <span className="text-sm text-gray-500">{session.mentee.name}</span>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-500 flex-wrap">
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

            {/* Agenda preview */}
            {session.agenda && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-1">{session.agenda}</p>
            )}
          </div>
        </div>

        {/* Right: Actions and indicators */}
        <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
          {needsPrep && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition-colors flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Start Prep</span>
            </button>
          )}

          {prepInProgress && (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Prep in Progress</span>
            </span>
          )}

          {session.status === 'ready' && (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Ready</span>
            </span>
          )}

          {/* Action items count */}
          {session.actionItems.length > 0 && (
            <div className="text-xs text-gray-500">
              {session.actionItems.filter((a) => a.status !== 'completed').length} pending actions
            </div>
          )}

          {/* Notes count for past sessions */}
          {isPast && session.notes.length > 0 && (
            <div className="text-xs text-gray-500">{session.notes.length} notes</div>
          )}

          {/* View arrow */}
          <ArrowRight className="w-5 h-5 text-red-600 mt-2" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RelationshipCard Component
// ---------------------------------------------------------------------------

function RelationshipCard({
  relationship,
  onScheduleSession,
}: {
  relationship: MentoringRelationship;
  onScheduleSession?: (relationshipId: string) => void;
}) {
  const typeLabel = relationshipTypeLabels[relationship.type];

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Paused' },
    ended: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Ended' },
  };

  const statusCfg = statusColors[relationship.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:border-red-600/30 transition-colors cursor-pointer">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Relationship info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Avatars */}
          <div className="flex -space-x-2 shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium border-2 border-white">
              {getInitials(relationship.mentor.name)}
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium border-2 border-white">
              {getInitials(relationship.mentee.name)}
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-gray-900 font-medium">{relationship.mentor.name}</span>
              <span className="text-gray-500">&rarr;</span>
              <span className="text-gray-900 font-medium">{relationship.mentee.name}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                {statusCfg.label}
              </span>
              <span className="text-gray-500">{typeLabel}</span>
              <span className="text-gray-500 hidden sm:inline">&bull;</span>
              <span className="text-gray-500 hidden sm:inline">{relationship.meetingFrequency}</span>
            </div>
          </div>
        </div>

        {/* Right: Stats and actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-900 font-medium">{relationship.totalSessions}</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>

            <div className="text-center hidden sm:block">
              <div className="text-gray-900 font-medium">{formatDate(relationship.startDate)}</div>
              <div className="text-xs text-gray-500">Started</div>
            </div>

            {relationship.nextSession && (
              <div className="text-center hidden lg:block">
                <div className="text-gray-900 font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-red-600" />
                  {formatDate(relationship.nextSession)}
                </div>
                <div className="text-xs text-gray-500">Next Session</div>
              </div>
            )}
          </div>

          {/* Schedule button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleSession?.(relationship.id);
            }}
            className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>

          <ArrowRight className="w-5 h-5 text-red-600 hidden sm:block" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NewSessionModal Component
// ---------------------------------------------------------------------------

const sessionTypes: SessionType[] = ['mentoring', 'one_on_one', 'check_in', 'review', 'planning'];

const durations = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hr' },
  { value: 90, label: '1.5 hr' },
];

function NewSessionModal({
  isOpen,
  onClose,
  relationships,
}: {
  isOpen: boolean;
  onClose: () => void;
  relationships: MentoringRelationship[];
}) {
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('mentoring');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [locationType, setLocationType] = useState<'in_person' | 'video'>('video');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedRelationship || !date || !time) return;
    // In a real app this would call an API
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-xl mx-4 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Schedule New Session</h2>
            <p className="text-sm text-gray-500">Set up a mentoring session</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Relationship Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Mentoring Relationship <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">Select a relationship...</option>
              {relationships.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.mentor.name} &rarr; {rel.mentee.name} ({relationshipTypeLabels[rel.type]})
                </option>
              ))}
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Session Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sessionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    sessionType === type
                      ? 'border-red-600 bg-red-50 text-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-red-600/50'
                  }`}
                >
                  {sessionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Time <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Duration</label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    duration === d.value
                      ? 'border-red-600 bg-red-50 text-gray-900'
                      : 'border-gray-200 text-gray-500 hover:border-red-600/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Meeting Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLocationType('video')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === 'video'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600/50'
                }`}
              >
                <Video className="w-5 h-5 text-red-600 mb-2" />
                <div className="font-medium text-gray-900 text-sm">Video Call</div>
                <div className="text-xs text-gray-500">Meet online</div>
              </button>
              <button
                type="button"
                onClick={() => setLocationType('in_person')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === 'in_person'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600/50'
                }`}
              >
                <MapPin className="w-5 h-5 text-red-600 mb-2" />
                <div className="font-medium text-gray-900 text-sm">In Person</div>
                <div className="text-xs text-gray-500">Meet in office</div>
              </button>
            </div>
          </div>

          {/* Location or Video Link */}
          {locationType === 'video' ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Video Link</label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Conference Room A"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          )}

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Agenda (optional)
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Topics to discuss in this session..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRelationship || !date || !time}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Mentoring Page
// ---------------------------------------------------------------------------

type MentoringTab = 'sessions' | 'relationships';

export default function MentoringPage() {
  const [activeTab, setActiveTab] = useState<MentoringTab>('sessions');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  const stats = mockStats;
  const relationships = mockRelationships;
  const sessions = mockSessions;

  // Filter sessions
  const upcomingSessions = sessions.filter(
    (s) => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'no_show'
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show'
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
              Mentoring
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Manage your mentoring relationships, sessions, and development conversations
            </p>
          </div>
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.activeRelationships}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Active Relationships</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.upcomingSessions}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Upcoming Sessions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.completedSessions}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Completed Sessions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.pendingActionItems}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Pending Actions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.overdueActionItems}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Overdue Actions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="text-xl sm:text-2xl font-medium text-gray-900">
                {stats.totalRelationships}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Total Relationships</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg w-full sm:w-fit mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors ${
              activeTab === 'sessions'
                ? 'bg-red-600 text-white'
                : 'text-gray-900 hover:bg-white'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm transition-colors ${
              activeTab === 'relationships'
                ? 'bg-red-600 text-white'
                : 'text-gray-900 hover:bg-white'
            }`}
          >
            Relationships
          </button>
        </div>

        {/* Tab Content - Sessions */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h3 className="text-gray-900 mb-4">
                Upcoming Sessions ({upcomingSessions.length})
              </h3>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming sessions</p>
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className="mt-4 text-sm text-red-600 hover:text-red-700"
                    >
                      Schedule a session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div>
                <h3 className="text-gray-900 mb-4">
                  Past Sessions ({pastSessions.length})
                </h3>
                <div className="space-y-3">
                  {pastSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Relationships */}
        {activeTab === 'relationships' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">
                Your Mentoring Relationships ({relationships.length})
              </h3>
              <button className="text-sm text-red-600 hover:text-red-700">
                + Add Relationship
              </button>
            </div>
            {relationships.length > 0 ? (
              <div className="grid gap-4">
                {relationships.map((relationship) => (
                  <RelationshipCard
                    key={relationship.id}
                    relationship={relationship}
                    onScheduleSession={() => setShowNewSessionModal(true)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500">No mentoring relationships</p>
                  <button className="mt-4 text-sm text-red-600 hover:text-red-700">
                    Add a relationship
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Session Modal */}
        <NewSessionModal
          isOpen={showNewSessionModal}
          onClose={() => setShowNewSessionModal(false)}
          relationships={relationships}
        />
      </main>
    </div>
  );
}
