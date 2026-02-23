'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Loader2, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import {
  useSessionPrep,
  useSubmitSessionPrep,
  useUpdateSessionPrep,
} from '@/hooks/api/useMentoring';
import type { MentoringSession } from '@/hooks/api/useMentoring';

interface SessionPrepModalProps {
  session: MentoringSession;
  tenantId: string | null;
  /** True when the current user is the mentee for this session */
  isMentee: boolean;
  onClose: () => void;
}

export function SessionPrepModal({ session, tenantId, isMentee, onClose }: SessionPrepModalProps) {
  const { data: prep, isLoading } = useSessionPrep(tenantId, session.id);
  const submitMutation = useSubmitSessionPrep(tenantId);
  const updateMutation = useUpdateSessionPrep(tenantId);

  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [questions, setQuestions] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate form when prep loads
  useEffect(() => {
    if (prep) {
      setWins(prep.wins ?? '');
      setChallenges(prep.challenges ?? '');
      setTopics(prep.topicsToDiscuss ?? []);
      setQuestions(prep.questionsForMentor ?? '');
    }
  }, [prep]);

  const isCompleted = session.status === 'completed' || session.status === 'cancelled';
  const canEdit = isMentee && !isCompleted;
  const isCreateMode = canEdit && !prep && !isLoading;
  const isReadMode = !canEdit || (!isEditing && !!prep);

  function addTopic() {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
    }
    setTopicInput('');
  }

  function removeTopic(t: string) {
    setTopics(topics.filter((x) => x !== t));
  }

  function handleTopicKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic();
    }
  }

  async function handleSave() {
    const input = {
      wins: wins.trim() || undefined,
      challenges: challenges.trim() || undefined,
      topicsToDiscuss: topics,
      questionsForMentor: questions.trim() || undefined,
    };

    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!prep) {
        await submitMutation.mutateAsync({ sessionId: session.id, input });
      } else {
        await updateMutation.mutateAsync({ sessionId: session.id, input });
      }
      setIsEditing(false);
      setSaveSuccess(true);
      // Auto-close after a brief moment on first submit
      if (!prep) {
        setTimeout(() => onClose(), 1200);
      }
    } catch {
      setSaveError('Failed to save prep. Please try again.');
    }
  }

  const isSaving = submitMutation.isPending || updateMutation.isPending;

  const sessionDate = new Date(session.scheduledAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Session Prep</h2>
              <p className="text-sm text-muted-foreground">
                {sessionDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
                {session.duration} min
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {saveError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {prep
                  ? 'Prep updated successfully.'
                  : 'Prep submitted — your mentor has been notified.'}
              </span>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Status banner */}
              {prep?.submittedAt && !isEditing && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Prep submitted {new Date(prep.submittedAt).toLocaleDateString()}</span>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-auto text-green-700 underline text-xs hover:no-underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              {!isMentee && !prep && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  The mentee hasn't submitted prep yet.
                </p>
              )}

              {!isMentee && prep && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0" />
                  Read-only — submitted by mentee
                </div>
              )}

              {/* Wins */}
              {(isCreateMode || isEditing || (isReadMode && (prep?.wins || prep?.wins === ''))) && (
                <div>
                  <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                    Wins since last session
                  </label>
                  {isReadMode ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px]">
                      {prep?.wins || <span className="italic">Not filled in</span>}
                    </p>
                  ) : (
                    <textarea
                      value={wins}
                      onChange={(e) => setWins(e.target.value)}
                      placeholder="What went well since your last session?"
                      rows={3}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  )}
                </div>
              )}

              {/* Challenges */}
              {(isCreateMode ||
                isEditing ||
                (isReadMode && (prep?.challenges || prep?.challenges === ''))) && (
                <div>
                  <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                    Challenges
                  </label>
                  {isReadMode ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px]">
                      {prep?.challenges || <span className="italic">Not filled in</span>}
                    </p>
                  ) : (
                    <textarea
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      placeholder="What's been challenging?"
                      rows={3}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  )}
                </div>
              )}

              {/* Topics */}
              <div>
                <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                  Topics to discuss
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-accent rounded-lg text-xs"
                    >
                      {t}
                      {!isReadMode && (
                        <button
                          onClick={() => removeTopic(t)}
                          className="hover:text-red-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {topics.length === 0 && isReadMode && (
                    <span className="text-sm text-muted-foreground italic">None listed</span>
                  )}
                </div>
                {!isReadMode && (
                  <div className="flex gap-2">
                    <input
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={handleTopicKeyDown}
                      placeholder="Type a topic and press Enter"
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <button
                      onClick={addTopic}
                      className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Questions for mentor */}
              {(isCreateMode ||
                isEditing ||
                (isReadMode && (prep?.questionsForMentor || prep?.questionsForMentor === ''))) && (
                <div>
                  <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                    Questions for mentor
                  </label>
                  {isReadMode ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px]">
                      {prep?.questionsForMentor || <span className="italic">Not filled in</span>}
                    </p>
                  ) : (
                    <textarea
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      placeholder="What questions do you want to ask?"
                      rows={3}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !isReadMode && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
            {!isEditing && !prep && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {prep ? 'Save changes' : 'Submit prep'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
