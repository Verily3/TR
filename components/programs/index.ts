// Components
export { ProgramsPage } from "./ProgramsPage";
export { ProgramCard } from "./ProgramCard";
export { ProgramDetailPage } from "./ProgramDetailPage";
export { ModuleViewLMS } from "./ModuleViewLMS";
export { PhaseProgressTracker } from "./PhaseProgressTracker";
export { ModuleProgressTracker } from "./ModuleProgressTracker";

// Types
export type {
  ProgramStatus,
  LessonType,
  LessonStatus,
  ModuleStatus,
  PhaseStatus,
  LinkedGoal,
  Lesson,
  Module,
  Phase,
  Program,
  ProgramsStats,
  ProgramDetailStats,
  LearningOutcome,
  ProgramStructureItem,
} from "./types";

// Props types
export type { ProgramsPageProps } from "./ProgramsPage";
export type { ProgramCardProps } from "./ProgramCard";
export type { ProgramDetailPageProps } from "./ProgramDetailPage";
export type { ModuleViewLMSProps } from "./ModuleViewLMS";
export type { PhaseProgressTrackerProps } from "./PhaseProgressTracker";
export type { ModuleProgressTrackerProps } from "./ModuleProgressTracker";

// Data (for testing/storybook)
export {
  defaultProgramsStats,
  defaultPrograms,
  defaultLearningOutcomes,
  defaultProgramStructure,
  filterOptions,
} from "./data";
export type { FilterId } from "./data";
