'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAssessmentSetup, useSubmitSetupRaters } from '@/hooks/api';
import type { RaterType } from '@/types/assessments';
import {
  ClipboardList,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RaterForm {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  raterType: RaterType;
}

const RATER_TYPE_LABELS: Record<RaterType, string> = {
  self: 'Self',
  manager: 'Manager / Boss',
  peer: 'Peer / Colleague',
  direct_report: 'Direct Report',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Invited', color: 'text-yellow-600' },
  sent: { label: 'Invited', color: 'text-blue-600' },
  viewed: { label: 'Viewed', color: 'text-blue-600' },
  started: { label: 'In Progress', color: 'text-orange-600' },
  completed: { label: 'Completed', color: 'text-green-600' },
  declined: { label: 'Declined', color: 'text-red-600' },
  expired: { label: 'Expired', color: 'text-muted-foreground' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessmentSetupPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: setup, isLoading, error } = useAssessmentSetup(token);
  const submitRaters = useSubmitSetupRaters(token);

  const [raters, setRaters] = useState<RaterForm[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [raterType, setRaterType] = useState<RaterType>('peer');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddRater = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setRaters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), raterType },
    ]);
    setFirstName('');
    setLastName('');
    setEmail('');
    setRaterType('peer');
  };

  const handleRemove = (id: string) => {
    setRaters((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async () => {
    if (raters.length === 0) {
      setFormError('Please add at least one reviewer before submitting.');
      return;
    }
    setFormError(null);

    try {
      await submitRaters.mutateAsync(
        raters.map((r) => ({
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          raterType: r.raterType,
        }))
      );
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit reviewers. Please try again.');
    }
  };

  // ── Loading / error states ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading your assessment...</p>
      </div>
    );
  }

  if (error || !setup) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">Link Not Found</h2>
        <p className="text-sm text-muted-foreground">
          This setup link is invalid or has expired. Please contact the person who sent it to you.
        </p>
      </div>
    );
  }

  // ── Already completed ──
  const isCompleted = !!setup.subjectSetupCompletedAt;
  const adminRaters = setup.raters.filter((r) => r.addedBy === 'admin');

  // ── Submission success ──
  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-sidebar-foreground mb-2">Reviewers Submitted!</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your reviewers have been invited to complete the <strong>{setup.name}</strong> assessment.
          They will receive an email with a link to submit their feedback.
        </p>

        <div className="mt-8 text-left bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Reviewers Invited</h3>
          </div>
          {raters.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">{r.firstName} {r.lastName}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </div>
              <span className="text-xs text-muted-foreground">{RATER_TYPE_LABELS[r.raterType]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Assessment Info */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {setup.template?.assessmentType ? `${setup.template.assessmentType}° Assessment` : 'Assessment'}
            </div>
            <h1 className="text-2xl font-bold text-sidebar-foreground">{setup.name}</h1>
            {setup.template && (
              <p className="text-sm text-muted-foreground mt-0.5">Template: {setup.template.name}</p>
            )}
          </div>
        </div>

        {setup.description && (
          <p className="mt-4 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{setup.description}</p>
        )}

        {setup.closeDate && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Responses due by {new Date(setup.closeDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Already completed view */}
      {isCompleted ? (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-base font-semibold text-sidebar-foreground">You've submitted your reviewers</h2>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-sidebar-foreground">Reviewer Status</span>
            </div>
            {setup.raters.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">No reviewers yet.</p>
            ) : (
              setup.raters.map((r) => {
                const statusInfo = STATUS_LABELS[r.status] ?? { label: r.status, color: 'text-muted-foreground' };
                const initials = `${r.firstName?.[0] ?? ''}${r.lastName?.[0] ?? ''}`.toUpperCase();

                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sidebar-foreground">
                        {r.firstName} {r.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</div>
                      <div className="text-[10px] text-muted-foreground">{RATER_TYPE_LABELS[r.raterType as RaterType] ?? r.raterType}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Admin-added raters (read-only) */}
          {adminRaters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-sidebar-foreground mb-3">Reviewers already configured</h3>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {adminRaters.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                      {r.firstName?.[0]}{r.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-sidebar-foreground">{r.firstName} {r.lastName}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{RATER_TYPE_LABELS[r.raterType as RaterType] ?? r.raterType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add your reviewers section */}
          {setup.subjectCanAddRaters ? (
            <div>
              <h2 className="text-base font-semibold text-sidebar-foreground mb-1">Add Your Reviewers</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Add the people you'd like to invite for feedback. They'll receive an email with a link to complete the assessment.
              </p>

              {/* Rater list */}
              {raters.length > 0 && (
                <div className="mb-5 bg-card border border-border rounded-xl overflow-hidden">
                  {raters.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
                        {r.firstName[0]}{r.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-sidebar-foreground">{r.firstName} {r.lastName}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{RATER_TYPE_LABELS[r.raterType]}</span>
                      <button onClick={() => handleRemove(r.id)} className="text-muted-foreground hover:text-accent transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add form */}
              <div className="bg-muted/20 border border-border rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add a Reviewer</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <select
                    value={raterType}
                    onChange={(e) => setRaterType(e.target.value as RaterType)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent text-sidebar-foreground"
                  >
                    {(Object.entries(RATER_TYPE_LABELS) as [RaterType, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddRater}
                    disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitRaters.isPending || raters.length === 0}
                className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitRaters.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending invitations...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Reviewers ({raters.length})
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Your reviewers are being configured by the assessment administrator.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
