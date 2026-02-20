/**
 * Programs types for frontend
 */

export type ProgramType = 'cohort' | 'self_paced';
export type ProgramStatus = 'draft' | 'active' | 'archived';
export type EnrollmentRole = 'learner' | 'mentor' | 'facilitator';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type ContentType =
  | 'lesson'
  | 'quiz'
  | 'assignment'
  | 'text_form'
  | 'goal'
  | 'survey';
export type ModuleDripType = 'immediate' | 'days_after_enrollment' | 'days_after_previous' | 'on_date';
export type LessonDripType = 'immediate' | 'sequential' | 'days_after_module_start' | 'on_date';
export type LessonStatus = 'draft' | 'active';
export type ApprovalRequired = 'none' | 'mentor' | 'facilitator' | 'both';
export type TaskResponseType = 'text' | 'file_upload' | 'goal' | 'completion_click' | 'discussion';
export type TaskProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ModuleType = 'module' | 'event';

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
  emailSettings?: {
    welcome?: boolean;
    kickoff?: boolean;
    weeklyDigest?: boolean;
    weeklyDigestDay?: number;
    inactivityReminders?: boolean;
    inactivityDays?: number;
    milestones?: boolean;
    completion?: boolean;
    mentorSummary?: boolean;
    mentorSummaryFrequency?: 'weekly' | 'biweekly';
    beforeDueReminders?: number[];
    afterDueReminders?: number[];
    subjectOverrides?: Record<string, string>;
    bodyOverrides?: Record<string, string>;
  };
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
    gradingMode?: 'auto_complete' | 'keyword' | 'manual';
    keywords?: string[];
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

export interface EventConfig {
  date?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  location?: string;
  zoomLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  description?: string;
  videoUrl?: string;
}

export interface TaskConfig {
  formPrompt?: string;
  minLength?: number;
  maxLength?: number;
  enableDiscussion?: boolean;
  goalPrompt?: string;
  requireMetrics?: boolean;
  requireActionSteps?: boolean;
  metricsGuidance?: string;
  actionStepsGuidance?: string;
  submissionTypes?: ('text' | 'file_upload' | 'url' | 'video' | 'presentation' | 'spreadsheet')[];
  maxFileSize?: number;
  allowedFileTypes?: string[];
  instructions?: string;
  questions?: string[];
}

export interface LessonTask {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  order: number;
  responseType: TaskResponseType;
  approvalRequired: ApprovalRequired;
  dueDate: string | null;
  dueDaysOffset: number | null;
  points: number;
  config: TaskConfig | null;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskProgressData {
  id: string;
  taskId: string;
  enrollmentId: string;
  status: TaskProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  pointsEarned: number;
  submissionData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
  tasks?: LessonTask[];
}

export interface Module {
  id: string;
  programId: string;
  parentModuleId: string | null;
  title: string;
  description: string | null;
  order: number;
  depth: number;
  type: ModuleType;
  eventConfig: EventConfig | null;
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
  eventCount?: number;
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
  isTemplate?: boolean;
  sourceTemplateId?: string | null;
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
  type?: ModuleType;
  eventConfig?: EventConfig;
  dripType?: ModuleDripType;
  dripValue?: number;
  dripDate?: string;
}

export interface UpdateModuleInput {
  title?: string;
  description?: string;
  order?: number;
  type?: ModuleType;
  eventConfig?: EventConfig;
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
  taskId: string | null;
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

// Task CRUD types
export interface CreateTaskInput {
  title: string;
  description?: string;
  order?: number;
  responseType?: TaskResponseType;
  approvalRequired?: ApprovalRequired;
  dueDate?: string;
  dueDaysOffset?: number;
  points?: number;
  config?: TaskConfig;
  status?: LessonStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  order?: number;
  responseType?: TaskResponseType;
  approvalRequired?: ApprovalRequired;
  dueDate?: string;
  dueDaysOffset?: number;
  points?: number;
  config?: TaskConfig;
  status?: LessonStatus;
}

// Task progress with task info (returned by task-progress endpoint)
export interface TaskWithProgress {
  id: string;
  lessonId: string;
  title: string;
  responseType: TaskResponseType;
  approvalRequired: ApprovalRequired;
  points: number;
  order: number;
  status: TaskProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  pointsEarned: number;
  submissionData: Record<string, unknown> | null;
}

// Quiz attempt types
export type QuizGradingStatus = 'auto_graded' | 'pending_grade' | 'graded';

export interface QuizBreakdownItem {
  questionId: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  yourAnswer: string | number | null;
  correctAnswer?: string | number;
  pointsEarned: number;
  pointsPossible: number;
  isCorrect?: boolean;
  gradingMode?: 'auto_complete' | 'keyword' | 'manual';
}

export interface QuizAttempt {
  id: string;
  lessonId: string;
  enrollmentId: string;
  attemptNumber: number;
  answers: Record<string, string | number>;
  score: string | null;         // numeric string e.g. "85.00"
  pointsEarned: number;
  passed: boolean | null;
  breakdown: QuizBreakdownItem[];
  gradingStatus: QuizGradingStatus;
  gradedBy: string | null;
  gradedAt: string | null;
  completedAt: string | null;
  createdAt: string;
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
