'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import type { LessonContent } from '@/types/programs';

type QuizQuestion = NonNullable<LessonContent['quizQuestions']>[number];
type QuestionType = QuizQuestion['type'];
type GradingMode = NonNullable<QuizQuestion['gradingMode']>;

interface QuizEditorProps {
  content: LessonContent;
  onChange: (updated: LessonContent) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-gray-50';

const SELECT_CLASS =
  'px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
};

const GRADING_MODE_LABELS: Record<GradingMode, string> = {
  auto_complete: 'Auto-complete (always full credit)',
  keyword: 'Keyword match',
  manual: 'Manual review by facilitator',
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultQuestion(type: QuestionType): QuizQuestion {
  return {
    id: generateId(),
    question: '',
    type,
    options: type === 'multiple_choice' ? ['', ''] : undefined,
    correctAnswer: type === 'true_false' ? 'True' : undefined,
    points: 10,
    gradingMode: type === 'short_answer' ? 'manual' : undefined,
    keywords: undefined,
  };
}

export function QuizEditor({ content, onChange }: QuizEditorProps) {
  const questions = content.quizQuestions ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  );

  function updateQuestions(updated: QuizQuestion[]) {
    onChange({ ...content, quizQuestions: updated });
  }

  function updateQuestion(id: string, patch: Partial<QuizQuestion>) {
    updateQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function addQuestion(type: QuestionType) {
    const q = defaultQuestion(type);
    updateQuestions([...questions, q]);
    setExpandedId(q.id);
  }

  function removeQuestion(id: string) {
    updateQuestions(questions.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= questions.length) return;
    const arr = [...questions];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    updateQuestions(arr);
  }

  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Quiz Settings */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-purple-900 mb-3">Quiz Settings</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Passing Score (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={content.passingScore ?? ''}
              onChange={(e) =>
                onChange({
                  ...content,
                  passingScore: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="70"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Max Attempts
            </label>
            <input
              type="number"
              min={1}
              value={content.maxAttempts ?? ''}
              onChange={(e) =>
                onChange({
                  ...content,
                  maxAttempts: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Unlimited"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={content.allowRetakes ?? false}
                onChange={(e) => onChange({ ...content, allowRetakes: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">Allow Retakes</span>
            </label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Total points: <strong>{totalPoints}</strong>{' '}
          {questions.length > 0 && `across ${questions.length} question${questions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Question List */}
      {questions.map((q, index) => {
        const isExpanded = expandedId === q.id;
        return (
          <div
            key={q.id}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* Question Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-400 w-6 flex-shrink-0">
                Q{index + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700 truncate">
                {q.question || <span className="text-gray-400 italic">Untitled question</span>}
              </span>
              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                {QUESTION_TYPE_LABELS[q.type]}
              </span>
              <span className="text-xs text-gray-500">{q.points ?? 0} pts</span>
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); moveQuestion(index, -1); }}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveQuestion(index, 1); }}
                  disabled={index === questions.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Delete question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Question Body */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                {/* Type + Points row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Question Type
                    </label>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value as QuestionType;
                        updateQuestion(q.id, {
                          type,
                          options: type === 'multiple_choice' ? ['', ''] : undefined,
                          correctAnswer: type === 'true_false' ? 'True' : undefined,
                          gradingMode: type === 'short_answer' ? 'manual' : undefined,
                          keywords: undefined,
                        });
                      }}
                      className={SELECT_CLASS}
                    >
                      {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={q.points ?? 0}
                      onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Question
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder="Enter your question..."
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>

                {/* Type-specific: Multiple Choice */}
                {q.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Options <span className="text-gray-400">(select the correct answer)</span>
                    </label>
                    <div className="space-y-2">
                      {(q.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === oi}
                            onChange={() => updateQuestion(q.id, { correctAnswer: oi })}
                            className="w-4 h-4 text-purple-600 flex-shrink-0"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...(q.options ?? [])];
                              opts[oi] = e.target.value;
                              updateQuestion(q.id, { options: opts });
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className={INPUT_CLASS}
                          />
                          {(q.options ?? []).length > 2 && (
                            <button
                              onClick={() => {
                                const opts = (q.options ?? []).filter((_, i) => i !== oi);
                                const correct = q.correctAnswer === oi ? undefined : q.correctAnswer;
                                updateQuestion(q.id, { options: opts, correctAnswer: correct });
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {(q.options ?? []).length < 6 && (
                        <button
                          onClick={() =>
                            updateQuestion(q.id, { options: [...(q.options ?? []), ''] })
                          }
                          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Option
                        </button>
                      )}
                    </div>
                    {q.correctAnswer === undefined && (
                      <p className="text-xs text-amber-600 mt-1">
                        Select a radio button to mark the correct answer
                      </p>
                    )}
                  </div>
                )}

                {/* Type-specific: True/False */}
                {q.type === 'true_false' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Correct Answer
                    </label>
                    <div className="flex gap-4">
                      {['True', 'False'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`tf-${q.id}`}
                            checked={q.correctAnswer === val}
                            onChange={() => updateQuestion(q.id, { correctAnswer: val })}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm text-gray-700">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type-specific: Short Answer */}
                {q.type === 'short_answer' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Grading Mode
                      </label>
                      <div className="space-y-1.5">
                        {(Object.entries(GRADING_MODE_LABELS) as [GradingMode, string][]).map(
                          ([mode, label]) => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`grading-${q.id}`}
                                checked={(q.gradingMode ?? 'manual') === mode}
                                onChange={() =>
                                  updateQuestion(q.id, {
                                    gradingMode: mode,
                                    keywords: mode === 'keyword' ? [] : undefined,
                                  })
                                }
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    {/* Keyword inputs */}
                    {(q.gradingMode ?? 'manual') === 'keyword' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Keywords <span className="text-gray-400">(answer must contain at least one)</span>
                        </label>
                        <div className="space-y-1.5">
                          {(q.keywords ?? []).map((kw, ki) => (
                            <div key={ki} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={kw}
                                onChange={(e) => {
                                  const kws = [...(q.keywords ?? [])];
                                  kws[ki] = e.target.value;
                                  updateQuestion(q.id, { keywords: kws });
                                }}
                                placeholder={`Keyword ${ki + 1}`}
                                className={INPUT_CLASS}
                              />
                              <button
                                onClick={() => {
                                  const kws = (q.keywords ?? []).filter((_, i) => i !== ki);
                                  updateQuestion(q.id, { keywords: kws });
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              updateQuestion(q.id, {
                                keywords: [...(q.keywords ?? []), ''],
                              })
                            }
                            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Keyword
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Question Button */}
      <div className="relative">
        <AddQuestionMenu onAdd={addQuestion} />
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No questions yet — add one above to get started.
        </p>
      )}
    </div>
  );
}

function AddQuestionMenu({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-purple-300 rounded-lg text-sm text-purple-600 hover:border-purple-400 hover:bg-purple-50 w-full justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Question
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
          {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([type, label]) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
