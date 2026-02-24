/**
 * Drip scheduling evaluation utilities.
 * Pure functions — no React dependencies.
 */

export type ModuleDripType =
  | 'immediate'
  | 'days_after_enrollment'
  | 'days_after_previous'
  | 'on_date';
export type LessonDripType = 'immediate' | 'sequential' | 'days_after_module_start' | 'on_date';

export interface DripContext {
  enrollmentDate: Date;
  now: Date;
  programStartDate: Date | null;
}

export interface ModuleDripInput {
  dripType: ModuleDripType;
  dripValue: number | null;
  dripDate: string | null;
}

export interface LessonDripInput {
  dripType: LessonDripType;
  dripValue: number | null;
  dripDate: string | null;
}

export interface DripResult {
  available: boolean;
  unlockDate: Date | null;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Evaluate module-level drip scheduling.
 *
 * @param module - drip config for the module
 * @param ctx - enrollment/time context
 * @param previousModuleCompletedAt - latest completedAt from any lesson in the previous module
 *   (null if no previous module or previous module not yet complete)
 */
export function evaluateModuleDrip(
  module: ModuleDripInput,
  ctx: DripContext,
  previousModuleCompletedAt: Date | null
): DripResult {
  switch (module.dripType) {
    case 'immediate':
      return { available: true, unlockDate: null };

    case 'days_after_enrollment': {
      if (!module.dripValue) return { available: true, unlockDate: null };
      const unlockDate = addDays(ctx.enrollmentDate, module.dripValue);
      return { available: ctx.now >= unlockDate, unlockDate };
    }

    case 'days_after_previous': {
      if (!module.dripValue) return { available: true, unlockDate: null };
      if (!previousModuleCompletedAt) {
        return { available: false, unlockDate: null };
      }
      const unlockDate = addDays(previousModuleCompletedAt, module.dripValue);
      return { available: ctx.now >= unlockDate, unlockDate };
    }

    case 'on_date': {
      if (!module.dripDate) return { available: true, unlockDate: null };
      const unlockDate = new Date(module.dripDate);
      return { available: ctx.now >= unlockDate, unlockDate };
    }

    default:
      return { available: true, unlockDate: null };
  }
}

/**
 * Evaluate lesson-level drip scheduling.
 *
 * @param lesson - drip config for the lesson
 * @param ctx - enrollment/time context
 * @param moduleUnlockDate - when the parent module became available (null = immediate)
 * @param previousLessonCompletedAt - completedAt of the previous lesson in the same module
 *   (null if first lesson or previous lesson not yet complete)
 */
export function evaluateLessonDrip(
  lesson: LessonDripInput,
  ctx: DripContext,
  moduleUnlockDate: Date | null,
  previousLessonCompletedAt: Date | null
): DripResult {
  switch (lesson.dripType) {
    case 'immediate':
      return { available: true, unlockDate: null };

    case 'sequential': {
      // First lesson in module is always available (caller passes null for prev)
      if (previousLessonCompletedAt === null) {
        return { available: false, unlockDate: null };
      }
      // Previous lesson completed → this one is available
      return { available: true, unlockDate: null };
    }

    case 'days_after_module_start': {
      if (!lesson.dripValue) return { available: true, unlockDate: null };
      const baseDate = moduleUnlockDate || ctx.enrollmentDate;
      const unlockDate = addDays(baseDate, lesson.dripValue);
      return { available: ctx.now >= unlockDate, unlockDate };
    }

    case 'on_date': {
      if (!lesson.dripDate) return { available: true, unlockDate: null };
      const unlockDate = new Date(lesson.dripDate);
      return { available: ctx.now >= unlockDate, unlockDate };
    }

    default:
      return { available: true, unlockDate: null };
  }
}

/**
 * Format a drip unlock date for user-facing display.
 */
export function formatDripMessage(unlockDate: Date | null, now: Date): string {
  if (!unlockDate) return 'Complete previous content to unlock';

  const diffMs = unlockDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '';
  if (diffDays === 1) return 'Available tomorrow';
  if (diffDays <= 7) return `Available in ${diffDays} days`;

  return `Available on ${unlockDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}
