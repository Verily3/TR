import { describe, it, expect } from 'vitest';
import { gradeQuizSubmission, applyManualGrades } from './quiz-engine.js';
import type { QuizBreakdownItem } from './quiz-engine.js';

describe('gradeQuizSubmission', () => {
  describe('multiple choice', () => {
    it('grades correct answer', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Pick A',
              type: 'multiple_choice',
              correctAnswer: 'A',
              points: 1,
            },
          ],
        },
        { q1: 'A' }
      );
      expect(result.pointsEarned).toBe(1);
      expect(result.score).toBe(100);
      expect(result.breakdown[0].isCorrect).toBe(true);
    });

    it('grades incorrect answer', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Pick A',
              type: 'multiple_choice',
              correctAnswer: 'A',
              points: 1,
            },
          ],
        },
        { q1: 'B' }
      );
      expect(result.pointsEarned).toBe(0);
      expect(result.score).toBe(0);
      expect(result.breakdown[0].isCorrect).toBe(false);
    });

    it('is case-insensitive', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Pick a',
              type: 'multiple_choice',
              correctAnswer: 'Answer',
              points: 1,
            },
          ],
        },
        { q1: 'answer' }
      );
      expect(result.breakdown[0].isCorrect).toBe(true);
    });

    it('handles missing answer as incorrect', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Pick A',
              type: 'multiple_choice',
              correctAnswer: 'A',
              points: 1,
            },
          ],
        },
        {}
      );
      expect(result.pointsEarned).toBe(0);
      expect(result.breakdown[0].isCorrect).toBe(false);
      expect(result.breakdown[0].yourAnswer).toBeNull();
    });

    it('handles custom point values', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Pick A',
              type: 'multiple_choice',
              correctAnswer: 'A',
              points: 5,
            },
          ],
        },
        { q1: 'A' }
      );
      expect(result.pointsEarned).toBe(5);
      expect(result.totalPoints).toBe(5);
    });

    it('defaults to 1 point when points is undefined', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Pick A', type: 'multiple_choice', correctAnswer: 'A' },
          ],
        },
        { q1: 'A' }
      );
      expect(result.pointsEarned).toBe(1);
      expect(result.totalPoints).toBe(1);
    });
  });

  describe('true/false', () => {
    it('grades true correctly (case-insensitive)', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Is sky blue?', type: 'true_false', correctAnswer: 'True' },
          ],
        },
        { q1: 'true' }
      );
      expect(result.breakdown[0].isCorrect).toBe(true);
    });

    it('grades false correctly', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Is sky green?', type: 'true_false', correctAnswer: 'False' },
          ],
        },
        { q1: 'false' }
      );
      expect(result.breakdown[0].isCorrect).toBe(true);
    });
  });

  describe('short answer — auto_complete', () => {
    it('always awards full points', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Explain',
              type: 'short_answer',
              gradingMode: 'auto_complete',
              points: 3,
            },
          ],
        },
        { q1: 'any answer here' }
      );
      expect(result.pointsEarned).toBe(3);
      expect(result.breakdown[0].isCorrect).toBe(true);
      expect(result.breakdown[0].gradingMode).toBe('auto_complete');
      expect(result.gradingStatus).toBe('auto_graded');
    });
  });

  describe('short answer — keyword', () => {
    it('awards points when answer contains keyword', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Define leadership',
              type: 'short_answer',
              gradingMode: 'keyword',
              keywords: ['leadership', 'influence'],
              points: 2,
            },
          ],
        },
        { q1: 'Leadership is the art of influence' }
      );
      expect(result.pointsEarned).toBe(2);
      expect(result.breakdown[0].isCorrect).toBe(true);
    });

    it('is case-insensitive for keywords', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Q',
              type: 'short_answer',
              gradingMode: 'keyword',
              keywords: ['Leadership'],
            },
          ],
        },
        { q1: 'leadership matters' }
      );
      expect(result.breakdown[0].isCorrect).toBe(true);
    });

    it('awards zero when no keywords match', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Q',
              type: 'short_answer',
              gradingMode: 'keyword',
              keywords: ['leadership'],
            },
          ],
        },
        { q1: 'something unrelated' }
      );
      expect(result.pointsEarned).toBe(0);
      expect(result.breakdown[0].isCorrect).toBe(false);
    });

    it('awards zero when keywords array is empty', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Q',
              type: 'short_answer',
              gradingMode: 'keyword',
              keywords: [],
            },
          ],
        },
        { q1: 'any answer' }
      );
      expect(result.pointsEarned).toBe(0);
    });
  });

  describe('short answer — manual', () => {
    it('awards zero points initially', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            {
              id: 'q1',
              question: 'Explain',
              type: 'short_answer',
              gradingMode: 'manual',
              points: 5,
            },
          ],
        },
        { q1: 'my detailed answer' }
      );
      expect(result.breakdown[0].pointsEarned).toBe(0);
      expect(result.breakdown[0].gradingMode).toBe('manual');
    });

    it('sets gradingStatus to pending_grade', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Explain', type: 'short_answer', gradingMode: 'manual' },
          ],
        },
        { q1: 'answer' }
      );
      expect(result.gradingStatus).toBe('pending_grade');
    });

    it('sets passed to null when manual review is pending', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Explain', type: 'short_answer', gradingMode: 'manual' },
          ],
          passingScore: 70,
        },
        { q1: 'answer' }
      );
      expect(result.passed).toBeNull();
    });

    it('score denominator excludes manual question points', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'MC', type: 'multiple_choice', correctAnswer: 'A', points: 1 },
            {
              id: 'q2',
              question: 'Manual',
              type: 'short_answer',
              gradingMode: 'manual',
              points: 4,
            },
          ],
        },
        { q1: 'A', q2: 'answer' }
      );
      // MC correct (1/1), manual excluded from denominator → score = 100
      expect(result.score).toBe(100);
      expect(result.totalPoints).toBe(5);
      expect(result.pointsEarned).toBe(1);
      expect(result.gradingStatus).toBe('pending_grade');
    });
  });

  describe('passing score', () => {
    it('passed = true when score >= passingScore', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [{ id: 'q1', question: 'Q', type: 'multiple_choice', correctAnswer: 'A' }],
          passingScore: 70,
        },
        { q1: 'A' }
      );
      expect(result.passed).toBe(true);
    });

    it('passed = false when score < passingScore', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [
            { id: 'q1', question: 'Q1', type: 'multiple_choice', correctAnswer: 'A' },
            { id: 'q2', question: 'Q2', type: 'multiple_choice', correctAnswer: 'B' },
          ],
          passingScore: 70,
        },
        { q1: 'A', q2: 'wrong' }
      );
      expect(result.score).toBe(50);
      expect(result.passed).toBe(false);
    });

    it('passed = true when no passingScore is set', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [{ id: 'q1', question: 'Q', type: 'multiple_choice', correctAnswer: 'A' }],
        },
        { q1: 'wrong' }
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('empty questions returns score 100 and passed true', () => {
      const result = gradeQuizSubmission({ quizQuestions: [] }, {});
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.gradingStatus).toBe('auto_graded');
    });

    it('undefined quizQuestions treated as empty', () => {
      const result = gradeQuizSubmission({}, {});
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('all auto_graded when no manual questions', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [{ id: 'q1', question: 'Q', type: 'multiple_choice', correctAnswer: 'A' }],
        },
        { q1: 'A' }
      );
      expect(result.gradingStatus).toBe('auto_graded');
    });

    it('short_answer defaults to manual when gradingMode is undefined', () => {
      const result = gradeQuizSubmission(
        {
          quizQuestions: [{ id: 'q1', question: 'Q', type: 'short_answer' }],
        },
        { q1: 'answer' }
      );
      expect(result.gradingStatus).toBe('pending_grade');
      expect(result.breakdown[0].gradingMode).toBe('manual');
    });
  });
});

describe('applyManualGrades', () => {
  const baseBreakdown: QuizBreakdownItem[] = [
    {
      questionId: 'q1',
      question: 'MC',
      type: 'multiple_choice',
      yourAnswer: 'A',
      correctAnswer: 'A',
      pointsEarned: 1,
      pointsPossible: 1,
      isCorrect: true,
    },
    {
      questionId: 'q2',
      question: 'Manual',
      type: 'short_answer',
      yourAnswer: 'my answer',
      pointsEarned: 0,
      pointsPossible: 5,
      gradingMode: 'manual',
    },
  ];

  it('updates breakdown item with awarded points', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 4 }], null);
    expect(result.breakdown[1].pointsEarned).toBe(4);
  });

  it('clamps awarded points to pointsPossible maximum', () => {
    const result = applyManualGrades(
      baseBreakdown,
      [{ questionId: 'q2', pointsAwarded: 10 }],
      null
    );
    expect(result.breakdown[1].pointsEarned).toBe(5);
  });

  it('sets isCorrect = true when full points awarded', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 5 }], null);
    expect(result.breakdown[1].isCorrect).toBe(true);
  });

  it('sets isCorrect = false when partial points awarded', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 3 }], null);
    expect(result.breakdown[1].isCorrect).toBe(false);
  });

  it('recomputes total score', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 5 }], null);
    // 1 + 5 = 6 out of 6 → 100%
    expect(result.pointsEarned).toBe(6);
    expect(result.score).toBe(100);
  });

  it('sets passed = true when score >= passingScore', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 5 }], 80);
    expect(result.passed).toBe(true);
  });

  it('sets passed = false when score < passingScore', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 0 }], 80);
    // 1 out of 6 ≈ 17%
    expect(result.passed).toBe(false);
  });

  it('sets passed = true when no passingScore', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 0 }], null);
    expect(result.passed).toBe(true);
  });

  it('leaves non-graded items unchanged', () => {
    const result = applyManualGrades(baseBreakdown, [{ questionId: 'q2', pointsAwarded: 3 }], null);
    expect(result.breakdown[0].pointsEarned).toBe(1);
    expect(result.breakdown[0].isCorrect).toBe(true);
  });
});
