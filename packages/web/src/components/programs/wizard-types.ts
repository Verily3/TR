export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

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

export interface WizardFormData {
  // Step 1: Basic Information
  internalName: string;
  title: string;
  coverImageUrl: string;
  description: string;
  learningTrack: string;

  // Step 2: Learning Objectives
  objectives: LearningObjective[];

  // Step 3: Schedule & Dates
  programType: 'cohort' | 'self_paced';
  startDate: string;
  endDate: string;
  estimatedDuration: number;
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
