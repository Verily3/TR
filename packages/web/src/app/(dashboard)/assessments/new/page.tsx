'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTemplates, useTenants, useUsers } from '@/hooks/api';
import type { AssessmentTemplate } from '@/types/assessments';
import type { Tenant } from '@/hooks/api/useTenants';
import { api } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  X,
  Plus,
  Users,
  ClipboardList,
  Building2,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface SelectedSubject {
  key: string;           // local UUID for tracking
  tenantId: string;
  tenantName: string;
  userId?: string;       // set if existing user
  firstName: string;
  lastName: string;
  email: string;
  isExternal: boolean;
  customName?: string;   // per-row name override in step 4
}

type RowStatus = 'pending' | 'loading' | 'success' | 'error';

interface RowState {
  status: RowStatus;
  error?: string;
}

const STEPS = [
  { number: 1, label: 'Template' },
  { number: 2, label: 'Subjects' },
  { number: 3, label: 'Configure' },
  { number: 4, label: 'Launch' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveAssessmentName(
  subject: SelectedSubject,
  pattern: string,
  templateName: string
): string {
  return (subject.customName ?? pattern)
    .replace('{firstName}', subject.firstName)
    .replace('{lastName}', subject.lastName)
    .replace('{templateName}', templateName);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewAssessmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAgencyUser = !!(user?.agencyId && !user?.tenantId);
  const { data: tenants } = useTenants();

  // ── Step 1: Template ──
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);

  // ── Step 2: Subjects ──
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);
  const [focusedTenantId, setFocusedTenantId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  // External add form (per focused tenant)
  const [extFirstName, setExtFirstName] = useState('');
  const [extLastName, setExtLastName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [showExtForm, setShowExtForm] = useState(false);

  // For tenant users: fixed tenant
  const fixedTenantId = !isAgencyUser ? (user?.tenantId ?? null) : null;

  // ── Step 3: Configure ──
  const [namePattern, setNamePattern] = useState('');
  const [description, setDescription] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [anonymizeResults, setAnonymizeResults] = useState(true);
  const [showResultsToSubject, setShowResultsToSubject] = useState(true);
  const [subjectCanAddRaters, setSubjectCanAddRaters] = useState(true);

  // ── Step 4: Launch ──
  const [rowStates, setRowStates] = useState<Map<string, RowState>>(new Map());
  const [editingNameKey, setEditingNameKey] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [launched, setLaunched] = useState(false);

  const [step, setStep] = useState<Step>(1);

  // ── Data fetching ──
  const { data: templatesData } = useTemplates({ status: 'published' });
  const templates = templatesData?.templates ?? [];

  // For agency users: the right panel loads users for the focused tenant
  const rightPanelTenantId = isAgencyUser ? focusedTenantId : fixedTenantId;
  const { data: usersData } = useUsers(
    rightPanelTenantId ?? undefined,
    { search: userSearch, limit: 30 }
  );
  const panelUsers = usersData?.data ?? [];

  // ── Auto-focus first tenant ──
  useEffect(() => {
    if (isAgencyUser && tenants?.length && !focusedTenantId) {
      // Pin "External / Independent" first, then alphabetical
      const sorted = sortTenants(tenants);
      setFocusedTenantId(sorted[0].id);
    }
  }, [isAgencyUser, tenants, focusedTenantId]);

  // ── Auto-populate name pattern when template is picked ──
  useEffect(() => {
    if (selectedTemplate && !namePattern) {
      setNamePattern(`{firstName}'s ${selectedTemplate.name}`);
    }
  }, [selectedTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sort tenants: catch-all first ──
  function sortTenants(list: Tenant[]): Tenant[] {
    return [...list].sort((a, b) => {
      const aExt = a.slug === 'external';
      const bExt = b.slug === 'external';
      if (aExt && !bExt) return -1;
      if (!aExt && bExt) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // ── Subject helpers ──
  function subjectsForTenant(tenantId: string) {
    return selectedSubjects.filter((s) => s.tenantId === tenantId);
  }

  function isUserSelected(userId: string) {
    return selectedSubjects.some((s) => s.userId === userId);
  }

  function toggleUser(u: { id: string; firstName: string; lastName: string; email: string }) {
    if (!rightPanelTenantId) return;
    const tenantName = isAgencyUser
      ? (tenants?.find((t) => t.id === rightPanelTenantId)?.name ?? '')
      : (user?.tenantId ?? '');

    if (isUserSelected(u.id)) {
      setSelectedSubjects((prev) => prev.filter((s) => s.userId !== u.id));
    } else {
      setSelectedSubjects((prev) => [
        ...prev,
        {
          key: crypto.randomUUID(),
          tenantId: rightPanelTenantId,
          tenantName,
          userId: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          isExternal: false,
        },
      ]);
    }
  }

  function handleAddExternal() {
    if (!extFirstName.trim() || !extLastName.trim() || !extEmail.trim()) return;
    if (!rightPanelTenantId) return;
    const tenantName = isAgencyUser
      ? (tenants?.find((t) => t.id === rightPanelTenantId)?.name ?? '')
      : (user?.tenantId ?? '');

    setSelectedSubjects((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        tenantId: rightPanelTenantId,
        tenantName,
        firstName: extFirstName.trim(),
        lastName: extLastName.trim(),
        email: extEmail.trim(),
        isExternal: true,
      },
    ]);
    setExtFirstName('');
    setExtLastName('');
    setExtEmail('');
    setShowExtForm(false);
  }

  function removeSubject(key: string) {
    setSelectedSubjects((prev) => prev.filter((s) => s.key !== key));
  }

  // ── Name pattern preview ──
  const namePreview = useMemo(() => {
    if (!namePattern || !selectedTemplate) return '';
    const first = selectedSubjects[0];
    if (!first) return namePattern.replace('{templateName}', selectedTemplate.name);
    return resolveAssessmentName(first, namePattern, selectedTemplate.name);
  }, [namePattern, selectedTemplate, selectedSubjects]);

  // ── Inline name editing in step 4 ──
  function startEditName(subject: SelectedSubject) {
    setEditingNameKey(subject.key);
    setEditingNameValue(
      subject.customName ?? resolveAssessmentName(subject, namePattern, selectedTemplate?.name ?? '')
    );
  }

  function commitEditName(key: string) {
    setSelectedSubjects((prev) =>
      prev.map((s) => s.key === key ? { ...s, customName: editingNameValue.trim() || undefined } : s)
    );
    setEditingNameKey(null);
  }

  // ── Step navigation ──
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return !!selectedTemplateId;
      case 2: return selectedSubjects.length > 0;
      case 3: return namePattern.trim().length > 0;
      case 4: return true;
    }
  }, [step, selectedTemplateId, selectedSubjects.length, namePattern]);

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as Step);
      // Reset search when entering step 2
      if (step === 1) setUserSearch('');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
    else router.push('/assessments');
  };

  // ── Launch all assessments ──
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!selectedTemplate) return;
    setIsLaunching(true);

    // Initialise all rows as pending
    const initial = new Map<string, RowState>();
    for (const s of selectedSubjects) initial.set(s.key, { status: 'pending' });
    setRowStates(initial);

    let allDone = true;

    for (const subject of selectedSubjects) {
      setRowStates((prev) => new Map(prev).set(subject.key, { status: 'loading' }));

      try {
        await api.post(`/api/tenants/${subject.tenantId}/assessments`, {
          templateId: selectedTemplateId,
          name: resolveAssessmentName(subject, namePattern, selectedTemplate.name),
          description: description.trim() || undefined,
          openDate: openDate || undefined,
          closeDate: closeDate || undefined,
          anonymizeResults,
          showResultsToSubject,
          subjectCanAddRaters,
          ...(subject.userId
            ? { subjectId: subject.userId }
            : {
                subjectEmail: subject.email,
                subjectFirstName: subject.firstName,
                subjectLastName: subject.lastName,
              }),
        });

        setRowStates((prev) => new Map(prev).set(subject.key, { status: 'success' }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create';
        setRowStates((prev) => new Map(prev).set(subject.key, { status: 'error', error: msg }));
        allDone = false;
      }
    }

    setIsLaunching(false);
    setLaunched(true);

    queryClient.invalidateQueries({ queryKey: ['assessments'] });
    queryClient.invalidateQueries({ queryKey: ['assessmentStats'] });

    if (allDone) {
      setTimeout(() => router.push('/assessments'), 1500);
    }
  };

  const sortedTenants = tenants ? sortTenants(tenants) : [];
  const selectedClientCount = new Set(selectedSubjects.map((s) => s.tenantId)).size;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/assessments')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold text-sidebar-foreground">New Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">Launch 180° or 360° feedback for one or more subjects</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const isActive = s.number === step;
          const isDone = s.number < step;
          return (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? 'bg-accent text-accent-foreground'
                    : isActive
                      ? 'bg-accent text-accent-foreground ring-4 ring-accent/20'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : s.number}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-accent' : isDone ? 'text-sidebar-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${isDone ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-xl">

        {/* ─── Step 1: Template ─── */}
        {step === 1 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-1">Choose a Template</h2>
            <p className="text-sm text-muted-foreground mb-6">Select the assessment framework to use</p>

            {templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No published templates available</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((t) => {
                  const isSelected = selectedTemplateId === t.id;
                  const competencyCount = t.config?.competencies?.length ?? 0;
                  const questionCount = t.config?.competencies?.reduce(
                    (sum: number, c: { questions?: unknown[] }) => sum + (c.questions?.length ?? 0),
                    0
                  ) ?? 0;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        setSelectedTemplate(t);
                        // Reset name pattern when template changes
                        setNamePattern(`{firstName}'s ${t.name}`);
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/40 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-semibold text-sm text-sidebar-foreground leading-snug">{t.name}</span>
                        <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          t.assessmentType === '360'
                            ? 'bg-purple-100 text-purple-700'
                            : t.assessmentType === '180'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {t.assessmentType}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{competencyCount} competencies</span>
                        <span>&bull;</span>
                        <span>{questionCount} questions</span>
                      </div>
                      {isSelected && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-accent font-medium">
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Subjects ─── */}
        {step === 2 && (
          <div className="p-0">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-sidebar-foreground mb-1">Select Subjects</h2>
              <p className="text-sm text-muted-foreground">Who will be assessed?</p>
            </div>

            {isAgencyUser ? (
              /* ── Two-column agency layout ── */
              <div className="flex" style={{ minHeight: 480 }}>
                {/* Left: client list */}
                <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
                  <div className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    Clients
                  </div>
                  {sortedTenants.map((t) => {
                    const isFocused = focusedTenantId === t.id;
                    const count = subjectsForTenant(t.id).length;
                    const isExtCatchAll = t.slug === 'external';

                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setFocusedTenantId(t.id);
                          setUserSearch('');
                          setShowExtForm(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-3 text-left transition-colors border-b border-border/50 last:border-0 ${
                          isFocused
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-muted/40 text-sidebar-foreground'
                        }`}
                      >
                        {isExtCatchAll
                          ? <Globe className="w-4 h-4 flex-shrink-0 opacity-60" />
                          : <Building2 className="w-4 h-4 flex-shrink-0 opacity-60" />
                        }
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">{t.name}</span>
                        {count > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right: user list for focused client */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {focusedTenantId ? (
                    <>
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                        {sortedTenants.find((t) => t.id === focusedTenantId)?.slug === 'external'
                          ? <Globe className="w-4 h-4 text-muted-foreground" />
                          : <Building2 className="w-4 h-4 text-muted-foreground" />
                        }
                        <span className="text-sm font-semibold text-sidebar-foreground">
                          {sortedTenants.find((t) => t.id === focusedTenantId)?.name}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {/* Skip user list for catch-all tenant */}
                        {sortedTenants.find((t) => t.id === focusedTenantId)?.slug !== 'external' && (
                          <>
                            {/* Search */}
                            <div className="relative mb-3">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>

                            {/* User list */}
                            {panelUsers.length > 0 ? (
                              <div className="border border-border rounded-lg overflow-hidden mb-4">
                                {panelUsers.map((u) => {
                                  const checked = isUserSelected(u.id);
                                  return (
                                    <label
                                      key={u.id}
                                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-border last:border-0 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleUser(u)}
                                        className="accent-accent w-4 h-4 flex-shrink-0"
                                      />
                                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                                        {u.firstName[0]}{u.lastName[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-sidebar-foreground">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4 mb-4">
                                {userSearch ? `No users matching "${userSearch}"` : 'No registered users'}
                              </p>
                            )}
                          </>
                        )}

                        {/* Add external person */}
                        {!showExtForm ? (
                          <button
                            onClick={() => setShowExtForm(true)}
                            className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add external person
                          </button>
                        ) : (
                          <div className="border border-border rounded-lg p-3 bg-muted/20">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">External Person</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input
                                type="text"
                                placeholder="First name"
                                value={extFirstName}
                                onChange={(e) => setExtFirstName(e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                              <input
                                type="text"
                                placeholder="Last name"
                                value={extLastName}
                                onChange={(e) => setExtLastName(e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                            <input
                              type="email"
                              placeholder="Email address"
                              value={extEmail}
                              onChange={(e) => setExtEmail(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleAddExternal}
                                disabled={!extFirstName.trim() || !extLastName.trim() || !extEmail.trim()}
                                className="flex-1 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setShowExtForm(false); setExtFirstName(''); setExtLastName(''); setExtEmail(''); }}
                                className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selected externals for this tenant */}
                        {subjectsForTenant(focusedTenantId).filter((s) => s.isExternal).length > 0 && (
                          <div className="mt-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Added Externals</p>
                            {subjectsForTenant(focusedTenantId).filter((s) => s.isExternal).map((s) => (
                              <div key={s.key} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">
                                  {s.firstName[0]}{s.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-sidebar-foreground">{s.firstName} {s.lastName}</span>
                                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">External</span>
                                </div>
                                <button onClick={() => removeSubject(s.key)} className="text-muted-foreground hover:text-accent transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Select a client to see their people</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Single-column tenant layout ── */
              <div className="p-6">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {panelUsers.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden mb-4">
                    {panelUsers.map((u) => {
                      const checked = isUserSelected(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 cursor-pointer border-b border-border last:border-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUser(u)}
                            className="accent-accent w-4 h-4 flex-shrink-0"
                          />
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-sidebar-foreground">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email} {u.title ? `· ${u.title}` : ''}</div>
                          </div>
                          {checked && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 mb-4">
                    {userSearch ? `No users matching "${userSearch}"` : 'No registered users found'}
                  </p>
                )}

                {/* Add external */}
                {!showExtForm ? (
                  <button
                    onClick={() => setShowExtForm(true)}
                    className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add external person
                  </button>
                ) : (
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">External Person</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="First name" value={extFirstName} onChange={(e) => setExtFirstName(e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      <input type="text" placeholder="Last name" value={extLastName} onChange={(e) => setExtLastName(e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <input type="email" placeholder="Email address" value={extEmail} onChange={(e) => setExtEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-3" />
                    <div className="flex gap-2">
                      <button onClick={handleAddExternal} disabled={!extFirstName.trim() || !extLastName.trim() || !extEmail.trim()}
                        className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40">
                        Add
                      </button>
                      <button onClick={() => { setShowExtForm(false); setExtFirstName(''); setExtLastName(''); setExtEmail(''); }}
                        className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer summary bar */}
            {selectedSubjects.length > 0 && (
              <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center gap-2 flex-wrap">
                <Users className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </span>
                {isAgencyUser && selectedClientCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    across {selectedClientCount} client{selectedClientCount !== 1 ? 's' : ''}
                  </span>
                )}
                <div className="flex flex-wrap gap-1.5 ml-1">
                  {selectedSubjects.map((s) => (
                    <span key={s.key} className="flex items-center gap-1 text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5">
                      {s.firstName} {s.lastName}
                      {s.isExternal && <span className="opacity-60">(ext)</span>}
                      <button onClick={() => removeSubject(s.key)} className="ml-0.5 hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Configure ─── */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground mb-1">Configure</h2>
              <p className="text-sm text-muted-foreground">
                These settings apply to all {selectedSubjects.length} assessment{selectedSubjects.length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Name pattern */}
            <div>
              <label className="block text-xs font-medium text-sidebar-foreground mb-1.5">
                Name Pattern <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={namePattern}
                onChange={(e) => setNamePattern(e.target.value)}
                placeholder="{firstName}'s {templateName}"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-xs text-muted-foreground">
                  Tokens: <code className="bg-muted px-1 rounded text-[10px]">{'{firstName}'}</code>{' '}
                  <code className="bg-muted px-1 rounded text-[10px]">{'{lastName}'}</code>{' '}
                  <code className="bg-muted px-1 rounded text-[10px]">{'{templateName}'}</code>
                </p>
                {namePreview && (
                  <p className="text-xs text-muted-foreground ml-auto">
                    Preview: <span className="font-medium text-sidebar-foreground">{namePreview}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-sidebar-foreground mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add any context or instructions..."
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-sidebar-foreground mb-1.5">Open Date (optional)</label>
                <input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-sidebar-foreground mb-1.5">Close Date (optional)</label>
                <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border">
              {[
                {
                  label: 'Anonymize rater results',
                  description: 'Rater identities are hidden in the final report',
                  value: anonymizeResults,
                  onChange: setAnonymizeResults,
                },
                {
                  label: 'Share results with subjects',
                  description: 'Subjects can view their own assessment results',
                  value: showResultsToSubject,
                  onChange: setShowResultsToSubject,
                },
                {
                  label: 'Allow subjects to add reviewers',
                  description: 'Each subject receives an email link to nominate their own reviewers',
                  value: subjectCanAddRaters,
                  onChange: setSubjectCanAddRaters,
                },
              ].map((toggle) => (
                <div key={toggle.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">{toggle.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{toggle.description}</p>
                  </div>
                  <button
                    onClick={() => toggle.onChange(!toggle.value)}
                    className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
                      toggle.value ? 'bg-accent' : 'bg-muted'
                    }`}
                    role="switch"
                    aria-checked={toggle.value}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      toggle.value ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 4: Review & Launch ─── */}
        {step === 4 && (
          <div className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-sidebar-foreground mb-1">Review & Launch</h2>
              <p className="text-sm text-muted-foreground">
                {launched
                  ? 'Assessments have been created.'
                  : `${selectedSubjects.length} assessment${selectedSubjects.length !== 1 ? 's' : ''} will be created. Click a name to rename before launching.`}
              </p>
            </div>

            {/* Summary table */}
            <div className="border border-border rounded-xl overflow-hidden mb-6">
              <div className="grid text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border px-4 py-2"
                style={{ gridTemplateColumns: isAgencyUser ? '1fr 1fr 1.5fr auto auto' : '1fr 1.5fr auto auto' }}>
                <span>Subject</span>
                {isAgencyUser && <span>Client</span>}
                <span>Assessment Name</span>
                {closeDate && <span>Close</span>}
                <span>Status</span>
              </div>

              {selectedSubjects.map((subject) => {
                const state = rowStates.get(subject.key);
                const resolvedName = resolveAssessmentName(subject, namePattern, selectedTemplate?.name ?? '');

                return (
                  <div
                    key={subject.key}
                    className="grid items-center px-4 py-3 border-b border-border last:border-0 gap-3"
                    style={{ gridTemplateColumns: isAgencyUser ? '1fr 1fr 1.5fr auto auto' : '1fr 1.5fr auto auto' }}
                  >
                    {/* Subject */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                        {subject.firstName[0]}{subject.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-sidebar-foreground truncate">{subject.firstName} {subject.lastName}</div>
                        {subject.isExternal && (
                          <span className="text-[10px] text-muted-foreground">External</span>
                        )}
                      </div>
                    </div>

                    {/* Client (agency only) */}
                    {isAgencyUser && (
                      <span className="text-sm text-muted-foreground truncate">{subject.tenantName}</span>
                    )}

                    {/* Assessment name (editable) */}
                    <div className="min-w-0">
                      {editingNameKey === subject.key ? (
                        <input
                          autoFocus
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={() => commitEditName(subject.key)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEditName(subject.key); if (e.key === 'Escape') setEditingNameKey(null); }}
                          className="w-full px-2 py-1 bg-background border border-accent rounded text-sm focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => !launched && !state?.status && startEditName(subject)}
                          disabled={launched || !!state?.status}
                          className="flex items-center gap-1.5 text-sm text-sidebar-foreground hover:text-accent transition-colors disabled:cursor-default group truncate max-w-full"
                        >
                          <span className="truncate">{subject.customName ?? resolvedName}</span>
                          {!launched && !state?.status && (
                            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 flex-shrink-0" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Close date */}
                    {closeDate && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-end">
                      {!state || state.status === 'pending' ? (
                        <span className="w-5 h-5" />
                      ) : state.status === 'loading' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : state.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
                          {state.error && (
                            <span className="text-[10px] text-accent max-w-[80px] truncate" title={state.error}>{state.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Settings summary */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mb-6">
              <span>Template: <span className="font-medium text-sidebar-foreground">{selectedTemplate?.name}</span></span>
              {closeDate && <span>Closes: <span className="font-medium text-sidebar-foreground">{new Date(closeDate).toLocaleDateString()}</span></span>}
              <span>Anonymized: <span className="font-medium text-sidebar-foreground">{anonymizeResults ? 'Yes' : 'No'}</span></span>
              <span>Subjects add reviewers: <span className="font-medium text-sidebar-foreground">{subjectCanAddRaters ? 'Yes' : 'No'}</span></span>
            </div>

            {!launched ? (
              <button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating assessments...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Launch {selectedSubjects.length} Assessment{selectedSubjects.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => router.push('/assessments')}
                className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                View Assessments
              </button>
            )}
          </div>
        )}

        {/* Footer nav (steps 1–3 only) */}
        {step < 4 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back button on step 4 (when not yet launched) */}
        {step === 4 && !launched && (
          <div className="px-6 py-4 border-t border-border">
            <button
              onClick={handleBack}
              disabled={isLaunching}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
