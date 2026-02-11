// Assessments/360 Types

export type AssessmentStatus = "draft" | "active" | "completed" | "cancelled";

export type RaterType = "self" | "manager" | "peer" | "direct_report" | "other";

export type RaterStatus = "pending" | "in_progress" | "completed" | "declined";

export type InvitationStatus = "pending" | "sent" | "reminded" | "completed" | "expired";

export interface Question {
  id: string;
  text: string;
}

export interface Competency {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
}

export interface ScaleConfig {
  min: number;
  max: number;
  labels: string[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  competencies: Competency[];
  scale: ScaleConfig;
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface Rater {
  id: string;
  person: Person;
  type: RaterType;
  status: RaterStatus;
  invitedAt: string;
  completedAt?: string;
  reminderCount: number;
}

export interface Assessment {
  id: string;
  templateId: string;
  templateName: string;
  subject: Person;
  status: AssessmentStatus;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  raters: Rater[];
  responseRate: number;
  hasResults: boolean;
}

export interface QuestionResponse {
  questionId: string;
  rating: number;
  comment?: string;
}

export interface CompetencyResponse {
  competencyId: string;
  responses: QuestionResponse[];
}

export interface RaterResponse {
  raterId: string;
  raterType: RaterType;
  completedAt: string;
  competencyResponses: CompetencyResponse[];
}

export interface CompetencyScore {
  competencyId: string;
  competencyName: string;
  selfScore?: number;
  managerScore?: number;
  peerScore?: number;
  directReportScore?: number;
  averageScore: number;
  gap?: number; // difference between self and others
}

export interface AssessmentResults {
  assessmentId: string;
  subjectName: string;
  completedAt: string;
  totalResponses: number;
  responsesByType: Record<RaterType, number>;
  competencyScores: CompetencyScore[];
  overallScore: number;
  strengths: string[];
  developmentAreas: string[];
}

export interface AssessmentStats {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  pendingResponses: number;
  averageResponseRate: number;
}

// Props interfaces
export interface AssessmentsPageProps {
  assessments?: Assessment[];
  stats?: AssessmentStats;
  templates?: AssessmentTemplate[];
  onViewAssessment?: (assessmentId: string) => void;
}

export interface AssessmentCardProps {
  assessment: Assessment;
  onView?: (assessmentId: string) => void;
  onSendReminder?: (assessmentId: string) => void;
}

export interface AssessmentDetailPageProps {
  assessment?: Assessment;
  template?: AssessmentTemplate;
  results?: AssessmentResults;
  onBack?: () => void;
}

export interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates?: AssessmentTemplate[];
  onCreate?: (assessment: Partial<Assessment>) => void;
}

export interface RaterResponseFormProps {
  assessment: Assessment;
  template: AssessmentTemplate;
  rater: Rater;
  onSubmit?: (response: RaterResponse) => void;
}
