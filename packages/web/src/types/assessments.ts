// ─── Template Types ─────────────────────────────────────────────────────────

export interface TemplateQuestion {
  id: string;
  text: string;
  type?: 'rating' | 'text' | 'multiple_choice';
  required?: boolean;
  reverseScored?: boolean;
  isCCI?: boolean;
}

export interface TemplateCompetency {
  id: string;
  name: string;
  description?: string;
  subtitle?: string;
  questions: TemplateQuestion[];
}

export interface TemplateConfig {
  competencies: TemplateCompetency[];
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
  raterTypes: ('self' | 'manager' | 'peer' | 'direct_report')[];
  showCompetenciesToRaters?: boolean;
  minRatersPerType?: Record<string, number>;
  maxRatersPerType?: Record<string, number>;
}

export interface AssessmentTemplate {
  id: string;
  agencyId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  assessmentType: '180' | '360' | 'custom';
  status: 'draft' | 'published' | 'archived';
  version: number;
  parentTemplateId: string | null;
  config: TemplateConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  total: number;
  draft: number;
  published: number;
  archived: number;
  byType: {
    '180': number;
    '360': number;
    custom: number;
  };
}

// ─── Assessment Types ───────────────────────────────────────────────────────

export type AssessmentStatus = 'draft' | 'open' | 'closed' | 'completed';
export type RaterType = 'self' | 'manager' | 'peer' | 'direct_report';
export type InvitationStatus =
  | 'pending'
  | 'sent'
  | 'viewed'
  | 'started'
  | 'completed'
  | 'declined'
  | 'expired';

export interface AssessmentSubject {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string | null;
  avatar?: string | null;
}

export interface AssessmentRater {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatar?: string | null;
}

export interface AssessmentInvitation {
  id: string;
  raterId: string | null;
  raterType: RaterType;
  status: InvitationStatus;
  accessToken: string | null;
  sentAt: string | null;
  viewedAt?: string | null;
  startedAt?: string | null;
  completedAt: string | null;
  reminderCount: string | null;
  lastReminderAt?: string | null;
  addedBy?: string;
  rater: AssessmentRater;
}

export interface Assessment {
  id: string;
  templateId: string;
  tenantId: string;
  subjectId: string | null;
  subjectEmail?: string | null;
  subjectFirstName?: string | null;
  subjectLastName?: string | null;
  subjectSetupToken?: string | null;
  subjectSetupCompletedAt?: string | null;
  subjectCanAddRaters?: boolean;
  createdBy: string | null;
  name: string;
  description: string | null;
  status: AssessmentStatus;
  openDate: string | null;
  closeDate: string | null;
  anonymizeResults: boolean;
  showResultsToSubject: boolean;
  computedResults: ComputedAssessmentResults | null;
  programId: string | null;
  enrollmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Create/Update Input Types ───────────────────────────────────────────────

export interface CreateAssessmentInput {
  templateId: string;
  subjectId?: string;
  subjectEmail?: string;
  subjectFirstName?: string;
  subjectLastName?: string;
  name: string;
  description?: string;
  openDate?: string;
  closeDate?: string;
  anonymizeResults?: boolean;
  showResultsToSubject?: boolean;
  subjectCanAddRaters?: boolean;
  programId?: string;
  enrollmentId?: string;
}

export interface AddInvitationItem {
  raterId?: string;
  raterEmail?: string;
  raterFirstName?: string;
  raterLastName?: string;
  raterType: RaterType;
  addedBy?: 'admin' | 'subject';
}

export interface AddInvitationsInput {
  invitations: AddInvitationItem[];
}

// ─── Setup Portal Types ───────────────────────────────────────────────────────

export interface AssessmentSetupInfo {
  id: string;
  name: string;
  description: string | null;
  subjectFirstName: string | null;
  subjectLastName: string | null;
  subjectEmail: string | null;
  subjectCanAddRaters: boolean;
  subjectSetupCompletedAt: string | null;
  closeDate: string | null;
  template: { name: string; assessmentType: string } | null;
  raters: {
    id: string;
    raterType: RaterType;
    status: InvitationStatus;
    addedBy: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  }[];
}

export interface AssessmentListItem extends Assessment {
  subject: AssessmentSubject | null;
  template: { name: string; assessmentType: string } | null;
  invitationStats: { total: number; completed: number };
  responseRate: number;
}

export interface AssessmentDetail extends Assessment {
  template: AssessmentTemplate | null;
  subject: AssessmentSubject | null;
  invitations: AssessmentInvitation[];
  invitationStats: { total: number; completed: number };
  responseRate: number;
}

export interface AssessmentStats {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  draftAssessments: number;
  pendingResponses: number;
  averageResponseRate: number;
}

// ─── Results Types ──────────────────────────────────────────────────────────

export interface ComputedCompetencyScore {
  competencyId: string;
  competencyName: string;
  scores: Record<string, number>;
  overallAverage: number;
  othersAverage: number;
  selfScore: number | null;
  gap: number;
  responseDistribution: Record<number, number>;
  raterAgreement: number;
}

export interface ComputedItemScore {
  competencyId: string;
  questionId: string;
  questionText: string;
  scores: Record<string, number>;
  overallAverage: number;
  selfScore: number | null;
  gap: number;
}

export interface RankedItem {
  competencyId: string;
  competencyName: string;
  questionId: string;
  questionText: string;
  overallAverage: number;
  selfScore: number | null;
  gap: number;
}

export interface GapEntry {
  competencyId: string;
  competencyName: string;
  selfScore: number;
  othersAverage: number;
  gap: number;
  classification: 'blind_spot' | 'hidden_strength' | 'aligned';
  interpretation: string;
}

export interface CCIResult {
  score: number;
  band: 'Low' | 'Moderate' | 'High' | 'Very High';
  items: {
    competencyId: string;
    competencyName: string;
    questionId: string;
    questionText: string;
    rawScore: number;
    effectiveScore: number;
  }[];
}

export interface CurrentCeiling {
  competencyId: string;
  competencyName: string;
  subtitle: string;
  score: number;
  narrative: string;
}

export interface TrendComparison {
  previousAssessmentId: string;
  previousCompletedAt: string;
  competencyChanges: {
    competencyId: string;
    competencyName: string;
    previousScore: number;
    currentScore: number;
    change: number;
    changePercent: number;
    direction: 'improved' | 'declined' | 'stable';
  }[];
  overallChange: number;
  overallDirection: 'improved' | 'declined' | 'stable';
}

export interface ComputedAssessmentResults {
  computedAt: string;
  overallScore: number;
  responseRateByType: Record<string, { invited: number; completed: number; rate: number }>;
  competencyScores: ComputedCompetencyScore[];
  itemScores: ComputedItemScore[];
  gapAnalysis: GapEntry[];
  topItems: RankedItem[];
  bottomItems: RankedItem[];
  strengths: string[];
  developmentAreas: string[];
  comments: { competencyId: string; raterType: string; comment: string }[];
  johariWindow: {
    openArea: string[];
    blindSpot: string[];
    hiddenArea: string[];
    unknownArea: string[];
  };
  cciResult?: CCIResult;
  currentCeiling?: CurrentCeiling;
  trend?: TrendComparison;
}

// ─── API Input Types ────────────────────────────────────────────────────────

export interface UpdateAssessmentInput {
  name?: string;
  description?: string;
  status?: AssessmentStatus;
  openDate?: string | null;
  closeDate?: string | null;
  anonymizeResults?: boolean;
  showResultsToSubject?: boolean;
  subjectCanAddRaters?: boolean;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  assessmentType?: '180' | '360' | 'custom';
  config: TemplateConfig;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  assessmentType?: '180' | '360' | 'custom';
  status?: 'draft' | 'published' | 'archived';
  config?: TemplateConfig;
}

// ─── List params ────────────────────────────────────────────────────────────

export interface AssessmentsListParams {
  page?: number;
  limit?: number;
  status?: string;
  subjectId?: string;
}

export interface TemplatesListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}
