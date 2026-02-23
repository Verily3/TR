'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  useOnboardingPath,
  useUpdateOnboardingProgress,
  useCompleteOnboarding,
  useSkipOnboarding,
  type CompletedStep,
} from '@/hooks/api/useOnboarding';
import { api } from '@/lib/api';
import type { ReactElement } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Target,
  Users,
  BookOpen,
  BarChart3,
  Sparkles,
  X,
} from 'lucide-react';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';

// ─── Constants ───────────────────────────────────────────────────────────────

const SUGGESTED_GOALS = [
  'Improve strategic communication',
  'Develop a high-performance team culture',
  'Strengthen executive presence',
  'Build cross-functional collaboration',
  'Enhance decision-making under pressure',
  'Develop emerging leaders',
  'Drive innovation and change',
  'Improve work-life integration',
];

const DEPARTMENTS = [
  'Executive Leadership',
  'Operations',
  'Sales',
  'Marketing',
  'Finance',
  'HR & People',
  'Technology',
  'Product',
  'Legal & Compliance',
  'Other',
];

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];

const INDUSTRIES = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Professional Services',
  'Retail & Consumer',
  'Education',
  'Government & Public Sector',
  'Non-profit',
  'Other',
];

const PROGRAM_INTERESTS = [
  { id: 'leadership', label: 'Leadership Development', icon: '🎯' },
  { id: 'management', label: 'Management Skills', icon: '👥' },
  { id: 'communication', label: 'Executive Communication', icon: '💬' },
  { id: 'strategy', label: 'Strategic Planning', icon: '📊' },
  { id: 'coaching', label: 'Coaching & Mentoring', icon: '🤝' },
  { id: 'change', label: 'Change Management', icon: '🔄' },
];

const STEP_ICONS: Record<string, ReactElement> = {
  welcome: <Sparkles className="w-8 h-8 text-accent" />,
  profile: <Users className="w-8 h-8 text-accent" />,
  organization: <BarChart3 className="w-8 h-8 text-accent" />,
  team: <Users className="w-8 h-8 text-accent" />,
  programs: <BookOpen className="w-8 h-8 text-accent" />,
  goals: <Target className="w-8 h-8 text-accent" />,
  prework: <BookOpen className="w-8 h-8 text-accent" />,
  setup: <Users className="w-8 h-8 text-accent" />,
  complete: <CheckCircle2 className="w-8 h-8 text-green-500" />,
};

// ─── Form state interfaces ────────────────────────────────────────────────────

interface ProfileData {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  phone: string;
}

interface OrgData {
  teamSize: string;
  industry: string;
  priorities: string;
}

interface TeamData {
  directReports: string;
  teamDescription: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const { data: pathData, isLoading: pathLoading } = useOnboardingPath();
  const updateProgress = useUpdateOnboardingProgress();
  const completeOnboarding = useCompleteOnboarding();
  const skipOnboarding = useSkipOnboarding();

  // Step navigation
  const [stepIdx, setStepIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Per-step form state
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    title: '',
    department: '',
    phone: '',
  });
  const [org, setOrg] = useState<OrgData>({
    teamSize: '',
    industry: '',
    priorities: '',
  });
  const [team, setTeam] = useState<TeamData>({
    directReports: '',
    teamDescription: '',
  });
  const [programInterests, setProgramInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');

  // Initialise from saved data + user profile
  useEffect(() => {
    if (user) {
      setProfile((p) => ({
        ...p,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!pathData) return;

    // Redirect if already done
    if (pathData.status === 'completed' || pathData.status === 'skipped') {
      router.replace('/dashboard');
      return;
    }

    // Restore saved step position
    const savedIdx = pathData.steps.findIndex((s) => s.id === pathData.currentStep);
    if (savedIdx > 0) setStepIdx(savedIdx);

    // Restore saved form data
    const fd = pathData.formData;
    if (fd?.profile) {
      const p = fd.profile as Partial<ProfileData>;
      setProfile((prev) => ({ ...prev, ...p }));
    }
    if (fd?.organization) {
      const o = fd.organization as Partial<OrgData>;
      setOrg((prev) => ({ ...prev, ...o }));
    }
    if (fd?.team) {
      const t = fd.team as Partial<TeamData>;
      setTeam((prev) => ({ ...prev, ...t }));
    }
    if (fd?.programs) {
      const pr = fd.programs as { interests?: string[] };
      setProgramInterests(pr.interests ?? []);
    }
    if (fd?.goals) {
      const g = fd.goals as { selected?: string[]; custom?: string };
      setSelectedGoals(g.selected ?? []);
      setCustomGoal(g.custom ?? '');
    }
  }, [pathData, router]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
    // Agency users don't do personal onboarding
    if (!authLoading && user?.agencyId && !user?.tenantId) {
      router.replace('/dashboard');
    }
    // Impersonating users skip onboarding — redirect back to dashboard
    if (!authLoading && user?.isImpersonating) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const steps = pathData?.steps ?? [];
  const currentStep = steps[stepIdx];
  const isLastStep = stepIdx === steps.length - 1;
  const completedStepIds = pathData?.completedSteps?.map((c) => c.stepId) ?? [];

  // ─── Save progress ──────────────────────────────────────────────────────────

  const buildFormData = useCallback(
    (stepId: string): Record<string, Record<string, unknown>> => {
      const map: Record<string, Record<string, unknown>> = {};
      if (stepId === 'profile') map.profile = { ...profile };
      if (stepId === 'organization') map.organization = { ...org };
      if (stepId === 'team') map.team = { ...team };
      if (stepId === 'programs') map.programs = { interests: programInterests };
      if (stepId === 'goals') map.goals = { selected: selectedGoals, custom: customGoal };
      return map;
    },
    [profile, org, team, programInterests, selectedGoals, customGoal]
  );

  const saveAndAdvance = useCallback(async () => {
    if (!currentStep || isSaving) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      const nextIdx = stepIdx + 1;
      const nextStep = steps[nextIdx];
      const newCompletedSteps: CompletedStep[] = [
        ...(pathData?.completedSteps ?? []),
        ...(completedStepIds.includes(currentStep.id)
          ? []
          : [{ stepId: currentStep.id, completedAt: new Date().toISOString() }]),
      ];

      // Save profile to user record in background
      if (currentStep.id === 'profile') {
        api
          .patch('/api/users/me', {
            firstName: profile.firstName || undefined,
            lastName: profile.lastName || undefined,
            title: profile.title || undefined,
            department: profile.department || undefined,
            phone: profile.phone || undefined,
          })
          .catch(() => {}); // non-blocking, ignore errors
      }

      if (isLastStep || !nextStep) {
        // Final step — mark complete
        await updateProgress.mutateAsync({
          currentStep: currentStep.id,
          completedSteps: newCompletedSteps,
          formData: buildFormData(currentStep.id),
          status: 'in_progress',
        });
        await completeOnboarding.mutateAsync();
        await refreshUser();
        router.push('/dashboard');
      } else {
        // Advance to next step
        await updateProgress.mutateAsync({
          currentStep: nextStep.id,
          completedSteps: newCompletedSteps,
          formData: buildFormData(currentStep.id),
          status: 'in_progress',
        });
        setStepIdx(nextIdx);
      }
    } catch {
      setSaveError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    currentStep,
    isSaving,
    stepIdx,
    steps,
    pathData,
    completedStepIds,
    isLastStep,
    profile,
    buildFormData,
    updateProgress,
    completeOnboarding,
    refreshUser,
    router,
  ]);

  const goBack = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }, [stepIdx]);

  const handleSkipAll = useCallback(async () => {
    setIsSaving(true);
    try {
      await skipOnboarding.mutateAsync();
      await refreshUser();
      router.push('/dashboard');
    } catch {
      setIsSaving(false);
    }
  }, [skipOnboarding, refreshUser, router]);

  // ─── Loading / auth states ──────────────────────────────────────────────────

  if (authLoading || pathLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ─── Step content renderer ──────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground max-w-md mx-auto">
              This quick setup takes about 3 minutes. We'll personalise your experience so you can
              hit the ground running.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
              {[
                { icon: '🎯', title: 'Set goals', desc: 'Define what success looks like' },
                { icon: '📚', title: 'Explore programs', desc: 'Find the right learning path' },
                { icon: '📊', title: 'Track progress', desc: 'Measure what matters most' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-medium text-sm text-sidebar-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                  First name
                </label>
                <input
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Jane"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                  Last name
                </label>
                <input
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Smith"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Job title
              </label>
              <input
                value={profile.title}
                onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. VP of Operations"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Department
              </label>
              <select
                value={profile.department}
                onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Phone <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 555 000 0000"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
        );

      case 'organization':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Team size
              </label>
              <div className="flex flex-wrap gap-2">
                {TEAM_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setOrg((o) => ({ ...o, teamSize: size }))}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      org.teamSize === size
                        ? 'border-accent bg-red-50 text-accent font-medium'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Industry
              </label>
              <select
                value={org.industry}
                onChange={(e) => setOrg((o) => ({ ...o, industry: e.target.value }))}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Top priorities <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={org.priorities}
                onChange={(e) => setOrg((o) => ({ ...o, priorities: e.target.value }))}
                placeholder="e.g. Growing revenue, improving retention, expanding into new markets…"
                rows={3}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                How many direct reports do you have?
              </label>
              <div className="flex flex-wrap gap-2">
                {['0', '1–3', '4–8', '9–15', '15+'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTeam((t) => ({ ...t, directReports: n }))}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      team.directReports === n
                        ? 'border-accent bg-red-50 text-accent font-medium'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Describe your team{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={team.teamDescription}
                onChange={(e) => setTeam((t) => ({ ...t, teamDescription: e.target.value }))}
                placeholder="e.g. A cross-functional team of engineers and product managers building our core platform…"
                rows={3}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
        );

      case 'programs':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the areas you're most interested in exploring.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROGRAM_INTERESTS.map((interest) => {
                const selected = programInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() =>
                      setProgramInterests((prev) =>
                        selected ? prev.filter((i) => i !== interest.id) : [...prev, interest.id]
                      )
                    }
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      selected ? 'border-accent bg-red-50' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="text-xl mb-1">{interest.icon}</div>
                    <p
                      className={`text-xs font-medium ${
                        selected ? 'text-accent' : 'text-sidebar-foreground'
                      }`}
                    >
                      {interest.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose goals that resonate with where you want to grow. You can edit these later.
            </p>
            <div className="space-y-2">
              {SUGGESTED_GOALS.map((goal) => {
                const selected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() =>
                      setSelectedGoals((prev) =>
                        selected ? prev.filter((g) => g !== goal) : [...prev, goal]
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                      selected
                        ? 'border-accent bg-red-50 text-accent'
                        : 'border-border hover:border-accent/50 text-sidebar-foreground'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-accent bg-accent' : 'border-border'
                      }`}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    {goal}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                Add your own goal{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g. Build a succession planning framework…"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
        );

      case 'prework':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Before your program begins, please complete the following prework.
            </p>
            <div className="p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
              Prework materials will be provided by your program facilitator.
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete your profile to get the most out of your program experience.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                  First name
                </label>
                <input
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Jane"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-sidebar-foreground block mb-1.5">
                  Last name
                </label>
                <input
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Smith"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground max-w-sm mx-auto">
              You're all set. Your personalised dashboard is ready and your goals have been saved.
            </p>
            {selectedGoals.length > 0 && (
              <div className="mt-6 text-left space-y-2 max-w-sm mx-auto">
                <p className="text-sm font-medium text-sidebar-foreground mb-2">Your goals:</p>
                {selectedGoals.slice(0, 3).map((g) => (
                  <div key={g} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {g}
                  </div>
                ))}
                {customGoal && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {customGoal}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Step content coming soon.</p>
          </div>
        );
    }
  };

  const isCompleteStep = currentStep.id === 'complete';
  const nextLabel = isLastStep ? (isCompleteStep ? 'Go to Dashboard' : 'Finish') : 'Continue';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg" />
          <span className="font-semibold text-sidebar-foreground">Results Tracking</span>
        </div>
        <button
          onClick={handleSkipAll}
          disabled={isSaving}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Skip setup
        </button>
      </header>

      {/* Progress */}
      {steps.length > 1 && (
        <div className="px-6 pt-6 pb-2 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-3">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                    i < stepIdx
                      ? 'bg-accent'
                      : i === stepIdx
                        ? 'bg-accent ring-4 ring-red-100'
                        : 'bg-border'
                  }`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      i < stepIdx ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {steps.length} · {currentStep.title}
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-2xl">
          {/* Step header */}
          <div className={`text-center mb-8 ${isCompleteStep ? '' : ''}`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-4">
              {STEP_ICONS[currentStep.id] ?? <Sparkles className="w-8 h-8 text-accent" />}
            </div>
            <h1 className="text-2xl font-bold text-sidebar-foreground">{currentStep.title}</h1>
            {currentStep.description && (
              <p className="text-muted-foreground mt-1.5 text-sm">{currentStep.description}</p>
            )}
          </div>

          {/* Error banner */}
          {saveError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Step content */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            {renderStepContent()}
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goBack}
              disabled={stepIdx === 0 || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={saveAndAdvance}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {nextLabel}
              {!isSaving && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
