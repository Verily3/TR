// Program Builder Types

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type ProgramType = "cohort" | "self-paced";

export type ProgramStatus = "draft" | "published" | "archived";

export type LessonStatus = "draft" | "published";

export type ParticipantRole = "learner" | "mentor" | "facilitator";

export type ParticipantStatus = "active" | "inactive" | "completed";

export type InfoSection = "basic" | "objectives" | "schedule" | "communication" | "settings";

export interface LearningObjective {
  id: string;
  text: string;
}

export interface EmailSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  timing?: string;
}

export interface ReminderTiming {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ProgramFormData {
  // Step 1: Basic Information
  internalName: string;
  title: string;
  coverImage?: string;
  description: string;
  learningTrack: string;

  // Step 2: Learning Objectives
  objectives: LearningObjective[];

  // Step 3: Schedule & Dates
  programType: ProgramType;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  timeZone: string;
  allowIndividualPacing: boolean;
  startOffset: number;
  deadlineFlexibility: number;

  // Step 4: Communication Settings
  emailSettings: EmailSetting[];
  beforeDueReminders: ReminderTiming[];
  afterDueReminders: ReminderTiming[];

  // Step 5: Target Audience
  targetAudience: string;
  prerequisites: string;
  recommendedFor: string;
}

export interface BuilderModule {
  id: string;
  title: string;
  lessonCount: number;
  lessons: BuilderLesson[];
  expanded: boolean;
}

export interface BuilderLesson {
  id: string;
  title: string;
  type: "reading" | "video" | "meeting" | "submission" | "assignment" | "goal";
  duration: string;
  status: LessonStatus;
}

export interface KeyConcept {
  id: string;
  title: string;
  description: string;
}

export interface LessonContent {
  introduction: string;
  mainContent: string;
  keyConcepts: KeyConcept[];
  keyTakeaway: string;
  visibleToLearners: boolean;
  visibleToMentors: boolean;
  visibleToFacilitators: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  progress: number;
}

export interface ParticipantStats {
  totalEnrolled: number;
  activeLearners: number;
  assignedMentors: number;
  facilitators: number;
}

export interface ProgramSettings {
  autoEnrollment: boolean;
  requireManagerApproval: boolean;
  allowSelfEnrollment: boolean;
  linkToGoals: boolean;
  issueCertificate: boolean;
  programCapacity?: number;
  enableWaitlist: boolean;
  sequentialModuleAccess: boolean;
  trackInScorecard: boolean;
}

// Props interfaces
export interface CreateProgramWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: ProgramFormData) => void;
}

export interface ProgramBuilderEditorProps {
  onBack?: () => void;
}
