/**
 * Type definitions for the Programs module
 */

/** Program status */
export type ProgramStatus = "completed" | "in-progress" | "not-started";

/** Lesson type */
export type LessonType =
  | "reading"
  | "video"
  | "meeting"
  | "submission"
  | "assignment"
  | "goal";

/** Lesson status */
export type LessonStatus = "completed" | "current" | "locked";

/** Module status */
export type ModuleStatus = "completed" | "in-progress" | "locked";

/** Phase status */
export type PhaseStatus = "completed" | "current" | "upcoming";

/** Linked goal */
export interface LinkedGoal {
  id: string;
  title: string;
  period: string;
  type: string;
  progress: number;
}

/** Lesson within a module */
export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  points: number;
  status: LessonStatus;
}

/** Module within a program */
export interface Module {
  id: string;
  number: number;
  title: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  progress: number;
  status: ModuleStatus;
  lessons: Lesson[];
}

/** Phase containing modules */
export interface Phase {
  id: string;
  name: string;
  modulesCompleted: number;
  modulesTotal: number;
  status: PhaseStatus;
  modules: Module[];
}

/** Program data */
export interface Program {
  id: string;
  title: string;
  description: string;
  track: string;
  trackColor: string;
  status: ProgramStatus;
  progress: number;
  dueDate: string;
  phasesCount: number;
  modulesCount: number;
  duration: string;
  linkedGoals: LinkedGoal[];
  nextAction?: string;
  phases: Phase[];
  totalPoints: number;
  earnedPoints: number;
}

/** Programs stats */
export interface ProgramsStats {
  total: number;
  inProgress: number;
  completed: number;
  notStarted: number;
}

/** Program detail stats */
export interface ProgramDetailStats {
  totalPoints: number;
  availablePoints: number;
  progress: number;
  modulesCompleted: number;
  modulesTotal: number;
  timeRemaining: string;
  dueDate: string;
  linkedGoalsCount: number;
}

/** Learning outcomes for program detail */
export interface LearningOutcome {
  id: string;
  text: string;
}

/** Program structure item for program detail */
export interface ProgramStructureItem {
  id: string;
  text: string;
}
