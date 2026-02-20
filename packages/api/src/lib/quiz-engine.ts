// Inline types (mirrors DB schema types — avoids import issues from @tr/db)

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string | number;
  points?: number;
  gradingMode?: 'auto_complete' | 'keyword' | 'manual';
  keywords?: string[];
}

interface QuizLessonContent {
  quizQuestions?: QuizQuestion[];
  passingScore?: number;
  allowRetakes?: boolean;
  maxAttempts?: number;
}

export interface QuizAnswers {
  [questionId: string]: string | number;
}

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

export type QuizGradingStatus = 'auto_graded' | 'pending_grade' | 'graded';

export interface QuizScoreResult {
  pointsEarned: number;
  totalPoints: number;
  score: number;
  passed: boolean | null;
  gradingStatus: QuizGradingStatus;
  breakdown: QuizBreakdownItem[];
}

/**
 * Grade a quiz submission.
 */
export function gradeQuizSubmission(
  content: QuizLessonContent,
  answers: QuizAnswers
): QuizScoreResult {
  const questions = content.quizQuestions ?? [];
  const passingScore = content.passingScore ?? null;

  let totalPoints = 0;
  let pointsEarned = 0;
  let hasPendingManual = false;
  const breakdown: QuizBreakdownItem[] = [];

  for (const q of questions) {
    const qPoints = q.points ?? 1;
    totalPoints += qPoints;
    const rawAnswer = answers[q.id];

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const correct =
        rawAnswer !== undefined && rawAnswer !== null
          ? String(rawAnswer).trim().toLowerCase() ===
            String(q.correctAnswer ?? '').trim().toLowerCase()
          : false;

      const earned = correct ? qPoints : 0;
      pointsEarned += earned;

      breakdown.push({
        questionId: q.id,
        question: q.question,
        type: q.type,
        yourAnswer: rawAnswer ?? null,
        correctAnswer: q.correctAnswer,
        pointsEarned: earned,
        pointsPossible: qPoints,
        isCorrect: correct,
      });
    } else if (q.type === 'short_answer') {
      const mode = q.gradingMode ?? 'manual';

      if (mode === 'auto_complete') {
        pointsEarned += qPoints;
        breakdown.push({
          questionId: q.id,
          question: q.question,
          type: 'short_answer',
          yourAnswer: rawAnswer ?? null,
          pointsEarned: qPoints,
          pointsPossible: qPoints,
          isCorrect: true,
          gradingMode: 'auto_complete',
        });
      } else if (mode === 'keyword') {
        const keywords = (q.keywords ?? []).map((k: string) => k.toLowerCase().trim());
        const answerText = String(rawAnswer ?? '').toLowerCase();
        const matched = keywords.length > 0 && keywords.some((kw: string) => answerText.includes(kw));
        const earned = matched ? qPoints : 0;
        pointsEarned += earned;

        breakdown.push({
          questionId: q.id,
          question: q.question,
          type: 'short_answer',
          yourAnswer: rawAnswer ?? null,
          pointsEarned: earned,
          pointsPossible: qPoints,
          isCorrect: matched,
          gradingMode: 'keyword',
        });
      } else {
        // manual — award 0 for now
        hasPendingManual = true;
        breakdown.push({
          questionId: q.id,
          question: q.question,
          type: 'short_answer',
          yourAnswer: rawAnswer ?? null,
          pointsEarned: 0,
          pointsPossible: qPoints,
          gradingMode: 'manual',
        });
      }
    }
  }

  // Score: if has pending manual, denominator excludes manual questions' points
  const manualPoints = questions
    .filter(
      (q: QuizQuestion) =>
        q.type === 'short_answer' && (q.gradingMode ?? 'manual') === 'manual'
    )
    .reduce((s: number, q: QuizQuestion) => s + (q.points ?? 1), 0);

  const scoreBase = hasPendingManual ? totalPoints - manualPoints : totalPoints;
  const score = scoreBase > 0 ? Math.round((pointsEarned / scoreBase) * 100) : 100;

  const passed: boolean | null = hasPendingManual
    ? null
    : passingScore !== null
      ? score >= passingScore
      : true;

  const gradingStatus: QuizGradingStatus = hasPendingManual ? 'pending_grade' : 'auto_graded';

  return { pointsEarned, totalPoints, score, passed, gradingStatus, breakdown };
}

/**
 * Apply facilitator manual grades to an existing attempt breakdown.
 */
export function applyManualGrades(
  existingBreakdown: QuizBreakdownItem[],
  questionGrades: { questionId: string; pointsAwarded: number }[],
  passingScore: number | null
): { pointsEarned: number; score: number; passed: boolean; breakdown: QuizBreakdownItem[] } {
  const gradeMap = new Map(questionGrades.map((g) => [g.questionId, g.pointsAwarded]));

  const updatedBreakdown = existingBreakdown.map((item) => {
    if (gradeMap.has(item.questionId)) {
      const awarded = gradeMap.get(item.questionId)!;
      return {
        ...item,
        pointsEarned: Math.min(awarded, item.pointsPossible),
        isCorrect: awarded >= item.pointsPossible,
      };
    }
    return item;
  });

  const totalPointsEarned = updatedBreakdown.reduce((s, i) => s + i.pointsEarned, 0);
  const totalPossible = updatedBreakdown.reduce((s, i) => s + i.pointsPossible, 0);
  const score = totalPossible > 0 ? Math.round((totalPointsEarned / totalPossible) * 100) : 100;
  const passed = passingScore !== null ? score >= passingScore : true;

  return { pointsEarned: totalPointsEarned, score, passed, breakdown: updatedBreakdown };
}
