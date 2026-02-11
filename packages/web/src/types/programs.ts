/**
 * Programs types for frontend
 */

export type ProgramType = 'cohort' | 'self_paced';
export type ProgramStatus = 'draft' | 'active' | 'archived';
export type EnrollmentRole = 'learner' | 'mentor' | 'facilitator';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type ContentType =
  | 'lesson'
  | 'sub_module'
  | 'quiz'
  | 'assignment'
  | 'mentor_meeting'
  | 'text_form'
  | 'goal'
  | 'mentor_approval'
  | 'facilitator_approval';
export type ModuleDripType = 'immediate' | 'days_after_enrollment' | 'days_after_previous' | 'on_date';
export type LessonDripType = 'immediate' | 'sequential' | 'days_after_module_start' | 'on_date';
export type LessonStatus = 'draft' | 'active';
export type ApprovalRequired = 'none' | 'mentor' | 'facilitator' | 'both';

export interface ProgramConfig {
  sequentialAccess?: boolean;
  trackInScorecard?: boolean;
  allowSelfEnrollment?: boolean;
  requireMentor?: boolean;
  // Wizard fields stored in config JSONB
  learningTrack?: string;
  objectives?: { id: string; text: string }[];
  allowIndividualPacing?: boolean;
  startOffset?: number;
  deadlineFlexibility?: number;
  estimatedDuration?: number;
  emailSettings?: { id: string; name: string; description: string; enabled: boolean; timing?: string }[];
  beforeDueReminders?: { id: string; label: string; enabled: boolean }[];
  afterDueReminders?: { id: string; label: string; enabled: boolean }[];
  targetAudience?: string;
  prerequisites?: string;
  recommendedFor?: string;
  autoEnrollment?: boolean;
  requireManagerApproval?: boolean;
  linkToGoals?: boolean;
  issueCertificate?: boolean;
  programCapacity?: number;
  enableWaitlist?: boolean;
}

export interface VisibilitySettings {
  learner: boolean;
  mentor: boolean;
  facilitator: boolean;
}

export interface LessonContent {
  introduction?: string;
  mainContent?: string;
  videoUrl?: string;
  keyConcepts?: { title: string; description: string }[];
  keyTakeaway?: string;
  reflectionPrompts?: string[];
  instructions?: string;
  questions?: string[];
  submissionFormat?: string;
  submissionTypes?: ('text' | 'file_upload' | 'url' | 'video' | 'presentation' | 'spreadsheet')[];
  maxFileSize?: number;
  allowedFileTypes?: string[];
  agenda?: string;
  discussionQuestions?: string[];
  preparationInstructions?: string;
  // Quiz type
  quizQuestions?: {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer?: string | number;
    points?: number;
  }[];
  passingScore?: number;
  allowRetakes?: boolean;
  maxAttempts?: number;
  // Text form type
  formPrompt?: string;
  minLength?: number;
  maxLength?: number;
  // Goal type
  goalPrompt?: string;
  requireMetrics?: boolean;
  requireActionSteps?: boolean;
  metricsGuidance?: string;
  actionStepsGuidance?: string;
  // Discussion toggle for text_form
  enableDiscussion?: boolean;
  // Lesson resources/attachments
  resources?: {
    title: string;
    url: string;
    type?: 'pdf' | 'doc' | 'video' | 'link' | 'spreadsheet';
  }[];
  // Task description shown on learn page with completion button
  taskTitle?: string;
  taskDescription?: string;
  // Role-specific content
  contentMode?: 'shared' | 'role-specific';
  roleContent?: {
    learner?: LessonContent;
    mentor?: LessonContent;
    facilitator?: LessonContent;
  };
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  contentType: ContentType;
  order: number;
  durationMinutes: number | null;
  points: number;
  content: LessonContent;
  dripType: LessonDripType;
  dripValue: number | null;
  dripDate: string | null;
  visibleTo: VisibilitySettings;
  approvalRequired: ApprovalRequired;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  programId: string;
  parentModuleId: string | null;
  title: string;
  description: string | null;
  order: number;
  depth: number;
  dripType: ModuleDripType;
  dripValue: number | null;
  dripDate: string | null;
  status: 'draft' | 'active';
  createdAt: string;
  updatedAt: string;
  lessons: Lesson[];
  subModules?: Module[];
}

export interface Program {
  id: string;
  tenantId: string | null;
  agencyId: string | null;
  name: string;
  internalName: string | null;
  description: string | null;
  type: ProgramType;
  status: ProgramStatus;
  coverImage: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  // Fields present on detail endpoint but not list endpoint
  timezone?: string;
  config?: ProgramConfig;
  createdBy?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  // Enrollment counts (from list API)
  enrollmentCount?: number;
  learnerCount?: number;
  moduleCount?: number;
  lessonCount?: number;
  totalPoints?: number;
  avgProgress?: number;
  createdByName?: string | null;
  myTenantEnrollmentCount?: number;
  // Current user's enrollment data (from list API)
  myEnrollmentId?: string | null;
  myRole?: string | null;
  myProgress?: number | null;
  myPointsEarned?: number | null;
  myEnrollmentStatus?: string | null;
}

export interface ProgramWithModules extends Program {
  modules: Module[];
  stats?: {
    totalEnrollments: number;
    learnerCount: number;
    mentorCount: number;
    facilitatorCount: number;
    completedCount: number;
    avgProgress: number;
  };
}

export interface Enrollment {
  id: string;
  programId: string;
  userId: string;
  tenantId: string | null;
  role: EnrollmentRole;
  status: EnrollmentStatus;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  progress: number;
  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  mentors?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }[];
}

export interface CreateProgramInput {
  name: string;
  internalName?: string;
  description?: string;
  type: ProgramType;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  config?: ProgramConfig;
}

export interface UpdateProgramInput {
  name?: string;
  internalName?: string;
  description?: string;
  type?: ProgramType;
  status?: ProgramStatus;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  config?: ProgramConfig;
}

export interface CreateModuleInput {
  title: string;
  description?: string;
  parentModuleId?: string;
  order?: number;
  dripType?: ModuleDripType;
  dripValue?: number;
  dripDate?: string;
}

export interface UpdateModuleInput {
  title?: string;
  description?: string;
  order?: number;
  dripType?: ModuleDripType;
  dripValue?: number;
  dripDate?: string;
  status?: 'draft' | 'active';
}

export interface CreateLessonInput {
  title: string;
  contentType?: ContentType;
  order?: number;
  durationMinutes?: number;
  points?: number;
  content?: LessonContent;
  dripType?: LessonDripType;
  dripValue?: number;
  dripDate?: string;
  visibleTo?: VisibilitySettings;
}

export interface UpdateLessonInput {
  title?: string;
  contentType?: ContentType;
  order?: number;
  durationMinutes?: number;
  points?: number;
  content?: LessonContent;
  dripType?: LessonDripType;
  dripValue?: number;
  dripDate?: string;
  visibleTo?: VisibilitySettings;
  approvalRequired?: ApprovalRequired;
  status?: LessonStatus;
}

export interface CreateEnrollmentInput {
  userId: string;
  role: EnrollmentRole;
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus;
  progress?: number;
}

export interface ProgramsListParams {
  page?: number;
  limit?: number;
  status?: ProgramStatus;
  type?: ProgramType;
  search?: string;
}

export interface EnrollmentsListParams {
  page?: number;
  limit?: number;
  role?: EnrollmentRole;
  status?: EnrollmentStatus;
}

// Progress types
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  id: string;
  moduleId: string;
  title: string;
  contentType: ContentType;
  points: number;
  status: LessonProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  pointsEarned: number;
}

export interface ProgressSummary {
  lessonsCompleted: number;
  totalLessons: number;
  percentage: number;
  pointsEarned: number;
  totalPoints: number;
}

export interface EnrollmentProgress {
  enrollment: Enrollment;
  progress: ProgressSummary;
  lessons: LessonProgress[];
}

// Module progress for UI
export interface ModuleProgressData {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  lessonsCompleted: number;
  totalLessons: number;
  progress: number;
  lessons: {
    id: string;
    title: string;
    contentType: ContentType;
    points: number;
    durationMinutes: number | null;
    status: LessonProgressStatus;
    completed: boolean;
  }[];
}

// Goal types
export interface GoalResponse {
  id: string;
  lessonId: string;
  enrollmentId: string;
  statement: string;
  successMetrics: string | null;
  actionSteps: string[];
  targetDate: string | null;
  reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithProgress extends GoalResponse {
  progress: number; // 0-100 from latest review
}

export interface CreateGoalInput {
  statement: string;
  successMetrics?: string;
  actionSteps?: string[];
  targetDate?: string;
  reviewFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
}

// Approval types
export type ReviewerRole = 'mentor' | 'facilitator';

export interface ApprovalSubmission {
  id: string;
  lessonId: string;
  enrollmentId: string;
  reviewerRole: ReviewerRole;
  submissionText: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

// Discussion types
export interface DiscussionPost {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorFirstName: string | null;
  authorLastName: string | null;
}
