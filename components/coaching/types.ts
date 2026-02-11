// Coaching Types

export type RelationshipType = "mentor" | "coach" | "manager";

export type SessionType = "coaching" | "one_on_one" | "check_in" | "review" | "planning";

export type SessionStatus = "scheduled" | "prep_in_progress" | "ready" | "completed" | "cancelled" | "no_show";

export type ActionItemPriority = "low" | "medium" | "high";

export type ActionItemStatus = "pending" | "in_progress" | "completed";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface CoachingRelationship {
  id: string;
  coach: Person;
  coachee: Person;
  type: RelationshipType;
  startDate: string;
  meetingFrequency: string;
  nextSession?: string;
  totalSessions: number;
  status: "active" | "paused" | "ended";
}

export interface SessionPrep {
  id: string;
  sessionId: string;
  wins: string[];
  challenges: string[];
  topicsToDiscuss: string[];
  submittedAt?: string;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface ActionItem {
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

export interface CoachingSession {
  id: string;
  relationshipId: string;
  coach: Person;
  coachee: Person;
  type: SessionType;
  status: SessionStatus;
  scheduledAt: string;
  duration: number; // minutes
  location?: string;
  videoLink?: string;
  agenda?: string;
  prep?: SessionPrep;
  notes: SessionNote[];
  actionItems: ActionItem[];
}

export interface CoachingStats {
  totalRelationships: number;
  activeRelationships: number;
  upcomingSessions: number;
  completedSessions: number;
  pendingActionItems: number;
  overdueActionItems: number;
}

// Props interfaces
export interface CoachingPageProps {
  stats?: CoachingStats;
  relationships?: CoachingRelationship[];
  sessions?: CoachingSession[];
  onViewSession?: (sessionId: string) => void;
}

export interface SessionCardProps {
  session: CoachingSession;
  onViewSession?: (sessionId: string) => void;
  onStartPrep?: (sessionId: string) => void;
}

export interface SessionDetailPageProps {
  session?: CoachingSession;
  onBack?: () => void;
}

export interface RelationshipCardProps {
  relationship: CoachingRelationship;
  onScheduleSession?: (relationshipId: string) => void;
  onViewDetails?: (relationshipId: string) => void;
}

export interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationships?: CoachingRelationship[];
  onCreate?: (session: Partial<CoachingSession>) => void;
}
