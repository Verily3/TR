/**
 * Survey types for frontend
 */

export type SurveyStatus = 'draft' | 'active' | 'closed';

export type SurveyQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'text'
  | 'rating'
  | 'nps'
  | 'yes_no'
  | 'ranking';

export interface SurveyQuestionConfig {
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  items?: string[];
  placeholder?: string;
}

export interface Survey {
  id: string;
  tenantId: string | null;
  agencyId: string | null;
  title: string;
  description: string | null;
  status: SurveyStatus;
  anonymous: boolean;
  requireLogin: boolean;
  allowMultipleResponses: boolean;
  showResultsToRespondent: boolean;
  shareToken: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields (from list endpoint)
  questionCount?: number;
  responseCount?: number;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  description: string | null;
  type: SurveyQuestionType;
  required: boolean;
  order: number;
  config: SurveyQuestionConfig | null;
  createdAt: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: SurveyQuestion[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string | null;
  enrollmentId: string | null;
  sessionToken: string | null;
  answers: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
}

// Results aggregation

export interface ChoiceResult {
  label: string;
  count: number;
  percent: number;
}

export interface RatingDistribution {
  value: number;
  count: number;
}

export interface RatingResult {
  average: number;
  distribution: RatingDistribution[];
}

export interface NpsResult {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface RankingItem {
  item: string;
  avgRank: number;
}

export interface SurveyQuestionResult {
  questionId: string;
  type: SurveyQuestionType;
  text: string;
  totalAnswers: number;
  data:
    | ChoiceResult[]        // single_choice, multiple_choice, yes_no
    | RatingResult          // rating
    | NpsResult             // nps
    | { responses: string[] } // text
    | RankingItem[]         // ranking
    | null;
}

export interface SurveyResults {
  totalResponses: number;
  questions: SurveyQuestionResult[];
}

// Input types

export interface CreateSurveyInput {
  title: string;
  description?: string;
  status?: SurveyStatus;
  anonymous?: boolean;
  requireLogin?: boolean;
  allowMultipleResponses?: boolean;
  showResultsToRespondent?: boolean;
}

export interface UpdateSurveyInput {
  title?: string;
  description?: string;
  status?: SurveyStatus;
  anonymous?: boolean;
  requireLogin?: boolean;
  allowMultipleResponses?: boolean;
  showResultsToRespondent?: boolean;
}

export interface CreateSurveyQuestionInput {
  text: string;
  description?: string;
  type: SurveyQuestionType;
  required?: boolean;
  order?: number;
  config?: SurveyQuestionConfig;
}

export interface UpdateSurveyQuestionInput {
  text?: string;
  description?: string;
  type?: SurveyQuestionType;
  required?: boolean;
  order?: number;
  config?: SurveyQuestionConfig;
}
