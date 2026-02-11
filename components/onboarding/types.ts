// Onboarding Types

export type OnboardingStepStatus = "pending" | "in_progress" | "completed" | "skipped";

export type OnboardingStepType =
  | "welcome"
  | "profile"
  | "goals"
  | "team"
  | "programs"
  | "coaching"
  | "assessments"
  | "settings"
  | "tour"
  | "complete";

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description: string;
  icon: string;
  status: OnboardingStepStatus;
  isRequired: boolean;
  estimatedMinutes: number;
  actionLabel?: string;
  skipLabel?: string;
  completedAt?: string;
}

export interface OnboardingProgress {
  userId: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: string;
  completedAt?: string;
  percentComplete: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  manager?: string;
  bio?: string;
  avatar?: string;
  timezone: string;
  language: string;
}

export interface OnboardingGoal {
  id: string;
  title: string;
  description: string;
  selected: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  invited: boolean;
}

// Props interfaces
export interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  steps?: OnboardingStep[];
  progress?: OnboardingProgress;
  initialStep?: number;
}

export interface OnboardingChecklistProps {
  steps?: OnboardingStep[];
  progress?: OnboardingProgress;
  onStepClick?: (stepId: string) => void;
  onDismiss?: () => void;
}

export interface WelcomeScreenProps {
  userName?: string;
  onGetStarted: () => void;
  onSkipTour: () => void;
}

export interface ProfileStepProps {
  profile?: Partial<UserProfile>;
  onUpdate: (profile: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface GoalsStepProps {
  goals?: OnboardingGoal[];
  onSelect: (goalId: string) => void;
  onNext: () => void;
  onBack: () => void;
}
