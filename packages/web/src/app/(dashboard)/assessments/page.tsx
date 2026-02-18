'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAssessments, useAssessmentStats, useAssessment, useAssessmentResults, useTemplates, useTenants } from '@/hooks/api';
import type { AssessmentListItem, AssessmentDetail, ComputedAssessmentResults, AssessmentTemplate as APITemplate, AssessmentInvitation } from '@/types/assessments';
import { DownloadReportButton } from '@/components/assessments/DownloadReportButton';
import { DevelopmentPlanView } from '@/components/assessments/DevelopmentPlanView';
import { CreateAssessmentChoiceModal } from '@/components/assessments/CreateAssessmentChoiceModal';
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  AlertCircle,
  ArrowRight,
  Send,
  X,
  Search,
  ChevronRight,
  Target,
  Award,
  AlertTriangle,
  ArrowLeft,
  Mail,
  BarChart3,
  FileText,
  Settings,
  Building2,
  ChevronDown,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AssessmentStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type AssessmentType = '180' | '360';
type RaterType = 'self' | 'manager' | 'peer' | 'direct_report' | 'other';
type RaterStatus = 'pending' | 'in_progress' | 'completed' | 'declined';

interface Question {
  id: string;
  text: string;
}

interface Competency {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
}

interface ScaleConfig {
  min: number;
  max: number;
  labels: string[];
}

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  competencies: Competency[];
  scale: ScaleConfig;
  allowComments: boolean;
  requireComments: boolean;
  anonymizeResponses: boolean;
}

interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

interface Rater {
  id: string;
  person: Person;
  type: RaterType;
  status: RaterStatus;
  invitedAt: string;
  completedAt?: string;
  reminderCount: number;
}

interface Assessment {
  id: string;
  templateId: string;
  templateName: string;
  assessmentType: AssessmentType;
  subject: Person;
  status: AssessmentStatus;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  raters: Rater[];
  responseRate: number;
  hasResults: boolean;
}

interface CompetencyScore {
  competencyId: string;
  competencyName: string;
  selfScore?: number;
  managerScore?: number;
  peerScore?: number;
  directReportScore?: number;
  averageScore: number;
  gap?: number;
}

interface AssessmentResults {
  assessmentId: string;
  subjectName: string;
  completedAt: string;
  totalResponses: number;
  responsesByType: Record<RaterType, number>;
  competencyScores: CompetencyScore[];
  overallScore: number;
  strengths: string[];
  developmentAreas: string[];
}

interface AssessmentStats {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  pendingResponses: number;
  averageResponseRate: number;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const samplePeople: Person[] = [
  { id: 'p1', name: 'John Doe', email: 'john.doe@company.com', role: 'Senior Manager' },
  { id: 'p2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Director' },
  { id: 'p3', name: 'Michael Chen', email: 'michael.chen@company.com', role: 'Team Lead' },
  { id: 'p4', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Manager' },
  { id: 'p5', name: 'James Wilson', email: 'james.wilson@company.com', role: 'VP Operations' },
  { id: 'p6', name: 'Amanda Rodriguez', email: 'amanda.rodriguez@company.com', role: 'Analyst' },
  { id: 'p7', name: 'David Kim', email: 'david.kim@company.com', role: 'Engineer' },
  { id: 'p8', name: 'Lisa Thompson', email: 'lisa.thompson@company.com', role: 'Coordinator' },
];

const defaultTemplates: AssessmentTemplate[] = [
  {
    id: 't1',
    name: 'Leadership 360',
    description: 'Comprehensive leadership assessment covering core competencies',
    competencies: [
      {
        id: 'c1',
        name: 'Strategic Thinking',
        description: 'Ability to think long-term and see the big picture',
        questions: [
          { id: 'q1', text: 'Demonstrates clear vision for the future' },
          { id: 'q2', text: 'Makes decisions aligned with organizational strategy' },
          { id: 'q3', text: 'Anticipates challenges and opportunities' },
        ],
      },
      {
        id: 'c2',
        name: 'Communication',
        description: 'Effectiveness in conveying information and ideas',
        questions: [
          { id: 'q4', text: 'Communicates clearly and concisely' },
          { id: 'q5', text: 'Actively listens to others' },
          { id: 'q6', text: 'Adapts communication style to audience' },
        ],
      },
      {
        id: 'c3',
        name: 'Team Development',
        description: 'Ability to build and develop high-performing teams',
        questions: [
          { id: 'q7', text: 'Provides regular feedback and mentoring' },
          { id: 'q8', text: 'Recognizes and develops talent' },
          { id: 'q9', text: 'Creates an inclusive team environment' },
        ],
      },
      {
        id: 'c4',
        name: 'Decision Making',
        description: 'Quality and timeliness of decisions',
        questions: [
          { id: 'q10', text: 'Makes timely decisions' },
          { id: 'q11', text: 'Considers multiple perspectives before deciding' },
          { id: 'q12', text: 'Takes accountability for decisions' },
        ],
      },
    ],
    scale: {
      min: 1,
      max: 5,
      labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    allowComments: true,
    requireComments: false,
    anonymizeResponses: true,
  },
  {
    id: 't2',
    name: 'Manager Effectiveness',
    description: 'Assessment for evaluating management capabilities',
    competencies: [
      {
        id: 'c5',
        name: 'Goal Setting',
        description: 'Ability to set clear and achievable goals',
        questions: [
          { id: 'q13', text: 'Sets clear expectations for the team' },
          { id: 'q14', text: 'Aligns team goals with organizational objectives' },
        ],
      },
      {
        id: 'c6',
        name: 'Performance Management',
        description: 'Effectiveness in managing team performance',
        questions: [
          { id: 'q15', text: 'Provides constructive feedback regularly' },
          { id: 'q16', text: 'Addresses performance issues promptly' },
        ],
      },
    ],
    scale: {
      min: 1,
      max: 5,
      labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    },
    allowComments: true,
    requireComments: true,
    anonymizeResponses: true,
  },
];

// Mock assessments removed — now using real API data

const defaultAssessmentStats: AssessmentStats = {
  totalAssessments: 5,
  activeAssessments: 2,
  completedAssessments: 2,
  pendingResponses: 3,
  averageResponseRate: 68,
};

const sampleCompetencyScores: CompetencyScore[] = [
  {
    competencyId: 'c1',
    competencyName: 'Strategic Thinking',
    selfScore: 4.2,
    managerScore: 3.8,
    peerScore: 4.0,
    directReportScore: 3.5,
    averageScore: 3.88,
    gap: 0.32,
  },
  {
    competencyId: 'c2',
    competencyName: 'Communication',
    selfScore: 3.8,
    managerScore: 4.2,
    peerScore: 4.1,
    directReportScore: 4.3,
    averageScore: 4.10,
    gap: -0.30,
  },
  {
    competencyId: 'c3',
    competencyName: 'Team Development',
    selfScore: 4.0,
    managerScore: 3.5,
    peerScore: 3.7,
    directReportScore: 3.2,
    averageScore: 3.60,
    gap: 0.40,
  },
  {
    competencyId: 'c4',
    competencyName: 'Decision Making',
    selfScore: 3.5,
    managerScore: 4.0,
    peerScore: 3.9,
    directReportScore: 3.8,
    averageScore: 3.80,
    gap: -0.30,
  },
];

const sampleResults: AssessmentResults = {
  assessmentId: 'a2',
  subjectName: 'Sarah Johnson',
  completedAt: '2024-11-28T15:00:00Z',
  totalResponses: 4,
  responsesByType: {
    self: 1,
    manager: 1,
    peer: 2,
    direct_report: 0,
    other: 0,
  },
  competencyScores: sampleCompetencyScores,
  overallScore: 3.85,
  strengths: ['Communication', 'Decision Making'],
  developmentAreas: ['Team Development', 'Strategic Thinking'],
};

const assessmentStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
  active: { label: 'Active', bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
};

const raterStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  declined: { label: 'Declined', bg: 'bg-red-100', text: 'text-red-700' },
};

const raterTypeLabels: Record<string, string> = {
  self: 'Self',
  manager: 'Manager',
  peer: 'Peer',
  direct_report: 'Direct Report',
  other: 'Other',
};

const raterTypeColors: Record<string, { bg: string; text: string }> = {
  self: { bg: 'bg-purple-100', text: 'text-purple-700' },
  manager: { bg: 'bg-blue-100', text: 'text-blue-700' },
  peer: { bg: 'bg-green-100', text: 'text-green-700' },
  direct_report: { bg: 'bg-orange-100', text: 'text-orange-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── AssessmentCard ────────────────────────────────────────────────────────────

function AssessmentCard({
  assessment,
  onView,
  onSendReminder,
}: {
  assessment: Assessment;
  onView?: (id: string) => void;
  onSendReminder?: (id: string) => void;
}) {
  const statusConfig = assessmentStatusConfig[assessment.status];

  const ratersByType = assessment.raters.reduce(
    (acc, rater) => {
      acc[rater.type] = (acc[rater.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const completedRaters = assessment.raters.filter((r) => r.status === 'completed').length;
  const totalRaters = assessment.raters.length;
  const pendingRaters = assessment.raters.filter(
    (r) => r.status === 'pending' || r.status === 'in_progress'
  ).length;

  const isOverdue =
    assessment.status === 'active' && new Date(assessment.dueDate) < new Date();

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-red-600/30 transition-colors cursor-pointer"
      onClick={() => onView?.(assessment.id)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Assessment info */}
        <div className="flex items-start gap-4">
          {/* Subject avatar */}
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg font-medium shrink-0">
            {getInitials(assessment.subject.name)}
          </div>

          {/* Assessment details */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-gray-900 font-medium">
                {assessment.subject.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
              >
                {statusConfig.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  assessment.assessmentType === '360'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {assessment.assessmentType}
              </span>
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500 mb-2">
              {assessment.subject.role} &bull; {assessment.templateName}
            </div>

            {/* Rater breakdown */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {Object.entries(ratersByType).map(([type, count]) => {
                const colors = raterTypeColors[type];
                return (
                  <span
                    key={type}
                    className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                  >
                    {raterTypeLabels[type]}: {count}
                  </span>
                );
              })}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due {formatDate(assessment.dueDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {completedRaters}/{totalRaters} responses
                </span>
              </div>
              {assessment.status === 'active' && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{pendingRaters} pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Progress and actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Response rate */}
          <div className="text-right">
            <div className="text-2xl font-medium text-gray-900">
              {assessment.responseRate}%
            </div>
            <div className="text-xs text-gray-500">Response Rate</div>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                assessment.responseRate === 100
                  ? 'bg-green-500'
                  : assessment.responseRate >= 50
                    ? 'bg-red-600'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${assessment.responseRate}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {assessment.status === 'active' && pendingRaters > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder?.(assessment.id);
                }}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Send Reminder
              </button>
            )}

            {assessment.hasResults && (
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Results Ready
              </span>
            )}

            <ArrowRight className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CreateAssessmentModal ─────────────────────────────────────────────────────

type ModalStep = 'template' | 'subject' | 'raters' | 'schedule' | 'review';

const modalSteps: { id: ModalStep; label: string }[] = [
  { id: 'template', label: 'Select Template' },
  { id: 'subject', label: 'Choose Subject' },
  { id: 'raters', label: 'Add Raters' },
  { id: 'schedule', label: 'Set Schedule' },
  { id: 'review', label: 'Review & Launch' },
];

function CreateAssessmentModal({
  isOpen,
  onClose,
  templates,
}: {
  isOpen: boolean;
  onClose: () => void;
  templates: AssessmentTemplate[];
}) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedRaters, setSelectedRaters] = useState<{ personId: string; type: string }[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentStepIndex = modalSteps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < modalSteps.length) {
      setCurrentStep(modalSteps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(modalSteps[prevIndex].id);
    }
  };

  const handleCreate = () => {
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setSelectedSubject(null);
    setSelectedRaters([]);
    setDueDate('');
    setSearchTerm('');
    onClose();
  };

  const filteredPeople = samplePeople.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return selectedTemplate !== null;
      case 'subject':
        return selectedSubject !== null;
      case 'raters':
        return selectedRaters.length > 0;
      case 'schedule':
        return dueDate !== '';
      default:
        return true;
    }
  };

  const toggleRater = (personId: string, type: string) => {
    const exists = selectedRaters.find((r) => r.personId === personId && r.type === type);
    if (exists) {
      setSelectedRaters(
        selectedRaters.filter((r) => !(r.personId === personId && r.type === type))
      );
    } else {
      setSelectedRaters([...selectedRaters, { personId, type }]);
    }
  };

  const raterTypes = [
    { id: 'self', label: 'Self' },
    { id: 'manager', label: 'Manager' },
    { id: 'peer', label: 'Peer' },
    { id: 'direct_report', label: 'Direct Report' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Assessment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {modalSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? 'bg-red-600 text-white'
                        : index === currentStepIndex
                          ? 'bg-red-50 text-red-600 border-2 border-red-600'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm hidden md:block">{step.label}</span>
                </div>
                {index < modalSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5 mx-2 text-gray-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-4">
              <p className="text-gray-500">Choose a template for this assessment</p>
              <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-red-600 bg-red-50/50'
                        : 'border-gray-200 hover:border-red-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{template.competencies.length} competencies</span>
                          <span>
                            {template.competencies.reduce(
                              (acc, c) => acc + c.questions.length,
                              0
                            )}{' '}
                            questions
                          </span>
                          <span>
                            Scale: {template.scale.min}-{template.scale.max}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedTemplate?.id === template.id
                            ? 'border-red-600 bg-red-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {selectedTemplate?.id === template.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Selection */}
          {currentStep === 'subject' && (
            <div className="space-y-4">
              <p className="text-gray-500">Who is this assessment for?</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => setSelectedSubject(person.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                      selectedSubject === person.id
                        ? 'border-red-600 bg-red-50/50'
                        : 'border-gray-200 hover:border-red-600/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-medium">
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-sm text-gray-500">
                        {person.role} &bull; {person.email}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSubject === person.id
                          ? 'border-red-600 bg-red-600'
                          : 'border-gray-400'
                      }`}
                    >
                      {selectedSubject === person.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raters Selection */}
          {currentStep === 'raters' && (
            <div className="space-y-4">
              <p className="text-gray-500">Select raters and assign their relationship type</p>
              <div className="flex items-center gap-4 text-sm">
                <Users className="w-4 h-4 text-red-600" />
                <span className="text-gray-500">{selectedRaters.length} raters selected</span>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-auto">
                {samplePeople
                  .filter((p) => p.id !== selectedSubject)
                  .map((person) => {
                    const personRaters = selectedRaters.filter((r) => r.personId === person.id);
                    return (
                      <div key={person.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium">
                            {getInitials(person.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{person.name}</div>
                            <div className="text-xs text-gray-500">{person.role}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {raterTypes.map((type) => {
                            const isSelected = personRaters.some((r) => r.type === type.id);
                            return (
                              <button
                                key={type.id}
                                onClick={() => toggleRater(person.id, type.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Schedule */}
          {currentStep === 'schedule' && (
            <div className="space-y-6">
              <p className="text-gray-500">Set the deadline for this assessment</p>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Reminder Schedule</h4>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>&bull; Initial invitation sent immediately</li>
                  <li>&bull; First reminder: 1 week before due date</li>
                  <li>&bull; Second reminder: 3 days before due date</li>
                  <li>&bull; Final reminder: 1 day before due date</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <p className="text-gray-500">Review your assessment details before launching</p>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-xs uppercase text-gray-500 mb-2">Template</h4>
                  <p className="font-medium text-gray-900">{selectedTemplate?.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTemplate?.competencies.length} competencies &bull;{' '}
                    {selectedTemplate?.competencies.reduce(
                      (acc, c) => acc + c.questions.length,
                      0
                    )}{' '}
                    questions
                  </p>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-xs uppercase text-gray-500 mb-2">Subject</h4>
                  {selectedSubject && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-medium">
                        {getInitials(
                          samplePeople.find((p) => p.id === selectedSubject)?.name || ''
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {samplePeople.find((p) => p.id === selectedSubject)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {samplePeople.find((p) => p.id === selectedSubject)?.role}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-xs uppercase text-gray-500 mb-2">
                    Raters ({selectedRaters.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {raterTypes.map((type) => {
                      const count = selectedRaters.filter((r) => r.type === type.id).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={type.id}
                          className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-500"
                        >
                          {type.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-xs uppercase text-gray-500 mb-2">Schedule</h4>
                  <p className="font-medium text-gray-900">
                    Due:{' '}
                    {dueDate
                      ? new Date(dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
            className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={currentStep === 'review' ? handleCreate : handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 'review' ? 'Launch Assessment' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CompetencyScoreRow ────────────────────────────────────────────────────────

function CompetencyScoreRow({ score }: { score: CompetencyScore }) {
  const scores = [
    { label: 'Self', value: score.selfScore, color: 'bg-purple-500' },
    { label: 'Manager', value: score.managerScore, color: 'bg-blue-500' },
    { label: 'Peers', value: score.peerScore, color: 'bg-green-500' },
    { label: 'Direct Reports', value: score.directReportScore, color: 'bg-orange-500' },
  ].filter((s) => s.value !== undefined);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">{score.competencyName}</h4>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {score.averageScore.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/ 5.0</span>
        </div>
      </div>

      {/* Score bars by rater type */}
      <div className="space-y-2">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-500">{s.label}</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color}`}
                style={{ width: `${((s.value || 0) / 5) * 100}%` }}
              />
            </div>
            <div className="w-10 text-sm text-gray-900 text-right">{s.value?.toFixed(1)}</div>
          </div>
        ))}
      </div>

      {/* Gap indicator */}
      {score.gap !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Self vs Others Gap</span>
            <span
              className={`text-sm font-medium ${
                Math.abs(score.gap) > 0.5
                  ? score.gap > 0
                    ? 'text-yellow-600'
                    : 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              {score.gap > 0 ? '+' : ''}
              {score.gap.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ResultsView ───────────────────────────────────────────────────────────────

function ResultsView({ results, apiResults }: { results: AssessmentResults; apiResults?: ComputedAssessmentResults }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">
              {results.overallScore.toFixed(1)}
            </span>
          </div>
          <div className="text-sm text-gray-500">Overall Score</div>
          <div className="text-xs text-gray-500 mt-1">out of 5.0</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{results.totalResponses}</span>
          </div>
          <div className="text-sm text-gray-500">Total Responses</div>
          <div className="text-xs text-gray-500 mt-1">
            Completed {formatDateLong(results.completedAt)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{results.strengths.length}</span>
          </div>
          <div className="text-sm text-gray-500">Key Strengths</div>
          <div className="text-xs text-green-600 mt-1">{results.strengths.join(', ')}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">
              {results.developmentAreas.length}
            </span>
          </div>
          <div className="text-sm text-gray-500">Development Areas</div>
          <div className="text-xs text-yellow-600 mt-1">
            {results.developmentAreas.join(', ')}
          </div>
        </div>
      </div>

      {/* Response Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Response Breakdown by Rater Type
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          {Object.entries(results.responsesByType).map(([type, count]) => {
            if (count === 0) return null;
            return (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{raterTypeLabels[type]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competency Scores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Competency Scores</h3>
        <div className="space-y-6">
          {results.competencyScores.map((score) => (
            <CompetencyScoreRow key={score.competencyId} score={score} />
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Competency Comparison</h3>
        <div className="aspect-square max-w-md mx-auto relative">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background circles */}
            {[1, 2, 3, 4, 5].map((level) => (
              <circle
                key={level}
                cx="100"
                cy="100"
                r={level * 18}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200"
              />
            ))}

            {/* Axes */}
            {results.competencyScores.map((_, index) => {
              const angle = (index * 360) / results.competencyScores.length - 90;
              const x2 = 100 + 90 * Math.cos((angle * Math.PI) / 180);
              const y2 = 100 + 90 * Math.sin((angle * Math.PI) / 180);
              return (
                <line
                  key={index}
                  x1="100"
                  y1="100"
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200"
                />
              );
            })}

            {/* Self score polygon */}
            <polygon
              points={results.competencyScores
                .map((score, index) => {
                  const angle = (index * 360) / results.competencyScores.length - 90;
                  const value = (score.selfScore || 0) / 5;
                  const x = 100 + value * 90 * Math.cos((angle * Math.PI) / 180);
                  const y = 100 + value * 90 * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="rgba(229, 62, 62, 0.2)"
              stroke="#E53E3E"
              strokeWidth="2"
            />

            {/* Average score polygon */}
            <polygon
              points={results.competencyScores
                .map((score, index) => {
                  const angle = (index * 360) / results.competencyScores.length - 90;
                  const value = score.averageScore / 5;
                  const x = 100 + value * 90 * Math.cos((angle * Math.PI) / 180);
                  const y = 100 + value * 90 * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth="2"
            />

            {/* Labels */}
            {results.competencyScores.map((score, index) => {
              const angle = (index * 360) / results.competencyScores.length - 90;
              const x = 100 + 105 * Math.cos((angle * Math.PI) / 180);
              const y = 100 + 105 * Math.sin((angle * Math.PI) / 180);
              return (
                <text
                  key={score.competencyId}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {score.competencyName.split(' ')[0]}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm text-gray-500">Self</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-gray-500">Others Avg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Self vs Others Gap Analysis</h3>
        <p className="text-sm text-gray-500 mb-6">
          Understanding the gap between self-perception and how others perceive you can reveal
          blind spots and hidden strengths.
        </p>
        <div className="space-y-4">
          {results.competencyScores.map((score) => {
            const gap = score.gap || 0;
            const absGap = Math.abs(gap);
            return (
              <div key={score.competencyId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="w-40 text-sm text-gray-900">{score.competencyName}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-20 text-right text-sm text-gray-500">
                    Self: {score.selfScore?.toFixed(1)}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full relative">
                    <div
                      className={`absolute top-0 h-full rounded-full ${
                        gap > 0 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{
                        left: gap > 0 ? '50%' : `${50 - absGap * 10}%`,
                        width: `${absGap * 10}%`,
                      }}
                    />
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-200" />
                  </div>
                  <div className="w-20 text-sm text-gray-500">
                    Avg: {score.averageScore.toFixed(1)}
                  </div>
                </div>
                <div className="w-32">
                  {gap > 0.5 ? (
                    <span className="text-xs text-yellow-600">Potential blind spot</span>
                  ) : gap < -0.5 ? (
                    <span className="text-xs text-green-600">Hidden strength</span>
                  ) : (
                    <span className="text-xs text-gray-500">Well aligned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Ceiling */}
      {apiResults?.currentCeiling && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 tracking-wide mb-1">
            CURRENT CEILING
          </h3>
          <p className="text-sm text-[#1B3A5C] font-medium mb-4">
            {apiResults.currentCeiling.competencyName}
            {apiResults.currentCeiling.subtitle && (
              <span className="text-gray-500 font-normal"> — {apiResults.currentCeiling.subtitle}</span>
            )}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
            {apiResults.currentCeiling.narrative}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-gray-500">Score</span>
            <span className="text-lg font-bold text-[#1B3A5C]">
              {apiResults.currentCeiling.score.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">/ 5.0</span>
          </div>
        </div>
      )}

      {/* Coaching Capacity Index (CCI) */}
      {apiResults?.cciResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Coaching Capacity Index</h3>
          <div className="flex items-center gap-6 mb-6">
            <div>
              <span className="text-3xl font-bold text-[#1B3A5C]">
                {apiResults.cciResult.score.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-2">/ 5.0</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              apiResults.cciResult.band === 'Very High' ? 'bg-green-100 text-green-700' :
              apiResults.cciResult.band === 'High' ? 'bg-blue-100 text-blue-700' :
              apiResults.cciResult.band === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {apiResults.cciResult.band}
            </span>
          </div>

          {/* CCI Gauge Bar */}
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-[#1B3A5C] transition-all"
              style={{ width: `${(apiResults.cciResult.score / 5) * 100}%` }}
            />
          </div>

          {/* CCI Item Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Item Breakdown</h4>
            {apiResults.cciResult.items.map((item) => (
              <div key={`${item.competencyId}-${item.questionId}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <span className="text-xs font-medium text-[#1B3A5C]">{item.competencyName}</span>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.questionText}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 ml-4">
                  {item.effectiveScore.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Comparison */}
      {apiResults?.trend && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Trend Comparison</h3>
          <p className="text-sm text-gray-500 mb-6">
            Compared with assessment completed on {formatDate(apiResults.trend.previousCompletedAt)}
          </p>

          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-500">Overall Direction</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              apiResults.trend.overallDirection === 'improved' ? 'bg-green-100 text-green-700' :
              apiResults.trend.overallDirection === 'declined' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {apiResults.trend.overallDirection === 'improved' ? '↑' :
               apiResults.trend.overallDirection === 'declined' ? '↓' : '→'}{' '}
              {apiResults.trend.overallDirection.charAt(0).toUpperCase() + apiResults.trend.overallDirection.slice(1)}
              {apiResults.trend.overallChange !== 0 && (
                <span className="ml-1">
                  ({apiResults.trend.overallChange > 0 ? '+' : ''}{apiResults.trend.overallChange.toFixed(2)})
                </span>
              )}
            </span>
          </div>

          <div className="space-y-3">
            {apiResults.trend.competencyChanges.map((change) => (
              <div key={change.competencyId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-900">{change.competencyName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{change.previousScore.toFixed(2)}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs text-gray-900 font-medium">{change.currentScore.toFixed(2)}</span>
                  <span className={`text-xs font-medium ${
                    change.direction === 'improved' ? 'text-green-600' :
                    change.direction === 'declined' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {change.change > 0 ? '+' : ''}{change.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AssessmentDetailView ──────────────────────────────────────────────────────

type DetailTab = 'overview' | 'raters' | 'results' | 'development' | 'settings';

const detailTabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
  { id: 'raters', label: 'Raters', icon: <Users className="w-4 h-4" /> },
  { id: 'results', label: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'development', label: 'Development', icon: <Target className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

function AssessmentDetailView({
  assessment,
  template,
  results,
  onBack,
  tenantId,
  apiResults,
}: {
  assessment: Assessment;
  template: AssessmentTemplate;
  results: AssessmentResults;
  onBack: () => void;
  tenantId?: string;
  apiResults?: ComputedAssessmentResults;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const statusConfig = assessmentStatusConfig[assessment.status];

  const completedRaters = assessment.raters.filter((r) => r.status === 'completed').length;
  const totalRaters = assessment.raters.length;

  const ratersByType = assessment.raters.reduce(
    (acc, rater) => {
      if (!acc[rater.type]) {
        acc[rater.type] = [];
      }
      acc[rater.type].push(rater);
      return acc;
    },
    {} as Record<string, Rater[]>
  );

  const isOverdue =
    assessment.status === 'active' && new Date(assessment.dueDate) < new Date();

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assessments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl font-medium shrink-0">
              {getInitials(assessment.subject.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {assessment.subject.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assessment.assessmentType === '360'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {assessment.assessmentType} Assessment
                </span>
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-gray-500">
                {assessment.subject.role} &bull; {assessment.templateName}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {formatDate(assessment.dueDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {completedRaters}/{totalRaters} responses
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Created {formatDate(assessment.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {assessment.hasResults && tenantId && (
              <DownloadReportButton
                tenantId={tenantId}
                assessmentId={assessment.id}
                assessmentName={`${assessment.subject.name} - ${assessment.templateName}`}
              />
            )}
            {assessment.status === 'active' && (
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Reminders
              </button>
            )}
            {assessment.status === 'draft' && (
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                Launch Assessment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit overflow-x-auto">
        {detailTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-900 hover:bg-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Response Progress</h3>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-red-600">{assessment.responseRate}%</div>
              <div className="text-sm text-gray-500">Response Rate</div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  assessment.responseRate === 100 ? 'bg-green-500' : 'bg-red-600'
                }`}
                style={{ width: `${assessment.responseRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{completedRaters} completed</span>
              <span className="text-gray-500">{totalRaters - completedRaters} remaining</span>
            </div>
          </div>

          {/* Rater Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rater Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(ratersByType).map(([type, raters]) => {
                const completed = raters.filter((r) => r.status === 'completed').length;
                const colors = raterTypeColors[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text}`}>
                      {raterTypeLabels[type]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {completed}/{raters.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Competencies</span>
                <span className="font-medium text-gray-900">
                  {template.competencies.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Questions</span>
                <span className="font-medium text-gray-900">
                  {template.competencies.reduce((acc, c) => acc + c.questions.length, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Scale</span>
                <span className="font-medium text-gray-900">
                  {template.scale.min} - {template.scale.max}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Comments</span>
                <span className="font-medium text-gray-900">
                  {template.requireComments
                    ? 'Required'
                    : template.allowComments
                      ? 'Optional'
                      : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Anonymous</span>
                <span className="font-medium text-gray-900">
                  {template.anonymizeResponses ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Competencies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Competencies Being Assessed
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {template.competencies.map((competency) => (
                <div key={competency.id} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">{competency.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{competency.description}</p>
                  <div className="text-xs text-gray-500">
                    {competency.questions.length} questions
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Raters */}
      {activeTab === 'raters' && (
        <div className="space-y-6">
          {Object.entries(ratersByType).map(([type, raters]) => {
            const colors = raterTypeColors[type];
            return (
              <div
                key={type}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${colors.bg} ${colors.text}`}
                    >
                      {raterTypeLabels[type]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {raters.filter((r) => r.status === 'completed').length}/{raters.length}{' '}
                      completed
                    </span>
                  </div>
                  {raters.some(
                    (r) => r.status === 'pending' || r.status === 'in_progress'
                  ) && (
                    <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Send Reminder
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {raters.map((rater) => {
                    const raterStatus = raterStatusConfig[rater.status];
                    return (
                      <div
                        key={rater.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-medium">
                            {getInitials(rater.person.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{rater.person.name}</div>
                            <div className="text-sm text-gray-500">{rater.person.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {rater.reminderCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {rater.reminderCount} reminder
                              {rater.reminderCount > 1 ? 's' : ''} sent
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${raterStatus.bg} ${raterStatus.text}`}
                          >
                            {raterStatus.label}
                          </span>
                          {rater.status === 'completed' && rater.completedAt && (
                            <span className="text-xs text-gray-500">
                              {formatDate(rater.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Raters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-dashed p-6">
            <button className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 transition-colors py-4">
              <Users className="w-5 h-5" />
              <span>Add More Raters</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Results */}
      {activeTab === 'results' && (
        <div>
          {assessment.hasResults ? (
            <ResultsView results={results} apiResults={apiResults} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-gray-900 mb-2">Results Not Available Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Results will be available once the assessment is completed
                </p>
                <div className="text-sm text-gray-500">
                  Current progress: {assessment.responseRate}% ({completedRaters}/{totalRaters}{' '}
                  responses)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Development */}
      {activeTab === 'development' && (
        <div>
          {assessment.hasResults && tenantId && apiResults ? (
            <DevelopmentPlanView
              tenantId={tenantId}
              assessmentId={assessment.id}
              results={apiResults}
              subjectName={assessment.subject.name}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-gray-900 mb-2">Development Plan Not Available</h3>
                <p className="text-sm text-gray-500">
                  Complete the assessment and compute results to generate a development plan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Assessment Settings</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Due Date</label>
              <input
                type="date"
                defaultValue={assessment.dueDate}
                className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
              <select className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Danger Zone</h4>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                  Cancel Assessment
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                  Delete Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Filter Tabs ───────────────────────────────────────────────────────────────

type FilterStatus = 'all' | AssessmentStatus;
type FilterType = 'all' | AssessmentType;

const filterOptions: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'completed', label: 'Completed' },
];

const typeFilterOptions: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: '180', label: '180 Assessment' },
  { id: '360', label: '360 Assessment' },
];

// ─── Main Page Component ───────────────────────────────────────────────────────

// ─── API Data Adapters ──────────────────────────────────────────────────────

function adaptAssessmentListItem(item: AssessmentListItem): Assessment {
  const subjectPerson: Person = item.subject
    ? {
        id: item.subject.id,
        name: `${item.subject.firstName} ${item.subject.lastName}`,
        email: item.subject.email,
        role: item.subject.title ?? undefined,
        avatar: item.subject.avatar ?? undefined,
      }
    : { id: '', name: 'Unknown', email: '' };

  // Map API status to page status ('open' -> 'active')
  const statusMap: Record<string, AssessmentStatus> = {
    draft: 'draft',
    open: 'active',
    closed: 'completed',
    completed: 'completed',
  };

  return {
    id: item.id,
    templateId: item.templateId,
    templateName: item.template?.name || 'Unknown Template',
    assessmentType: (item.template?.assessmentType || '360') as AssessmentType,
    subject: subjectPerson,
    status: statusMap[item.status] || 'draft',
    createdAt: item.createdAt,
    dueDate: item.closeDate || '',
    completedAt: item.status === 'completed' ? item.updatedAt : undefined,
    raters: [],
    responseRate: item.responseRate,
    hasResults: item.computedResults != null,
  };
}

function adaptTemplate(tmpl: APITemplate): AssessmentTemplate {
  return {
    id: tmpl.id,
    name: tmpl.name,
    description: tmpl.description ?? undefined,
    competencies: tmpl.config.competencies.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      questions: c.questions.map((q) => ({ id: q.id, text: q.text })),
    })),
    scale: {
      min: tmpl.config.scaleMin,
      max: tmpl.config.scaleMax,
      labels: tmpl.config.scaleLabels,
    },
    allowComments: tmpl.config.allowComments,
    requireComments: tmpl.config.requireComments,
    anonymizeResponses: tmpl.config.anonymizeResponses,
  };
}

function adaptDetailToAssessment(detail: AssessmentDetail): Assessment {
  const subjectPerson: Person = detail.subject
    ? {
        id: detail.subject.id,
        name: `${detail.subject.firstName} ${detail.subject.lastName}`,
        email: detail.subject.email,
        role: detail.subject.title ?? undefined,
        avatar: detail.subject.avatar ?? undefined,
      }
    : { id: '', name: 'Unknown', email: '' };

  const statusMap: Record<string, AssessmentStatus> = {
    draft: 'draft',
    open: 'active',
    closed: 'completed',
    completed: 'completed',
  };

  const raters: Rater[] = (detail.invitations || []).map((inv: AssessmentInvitation) => {
    const statusInvMap: Record<string, RaterStatus> = {
      pending: 'pending',
      sent: 'pending',
      viewed: 'pending',
      started: 'in_progress',
      completed: 'completed',
      declined: 'declined',
      expired: 'declined',
    };

    return {
      id: inv.id,
      person: {
        id: inv.raterId,
        name: `${inv.rater.firstName || ''} ${inv.rater.lastName || ''}`.trim() || 'Unknown',
        email: inv.rater.email || '',
        avatar: inv.rater.avatar ?? undefined,
      },
      type: inv.raterType as RaterType,
      status: statusInvMap[inv.status] || 'pending',
      invitedAt: inv.sentAt || detail.createdAt,
      completedAt: inv.completedAt ?? undefined,
      reminderCount: parseInt(inv.reminderCount || '0', 10),
    };
  });

  return {
    id: detail.id,
    templateId: detail.templateId,
    templateName: detail.template?.name || 'Unknown Template',
    assessmentType: (detail.template?.assessmentType || '360') as AssessmentType,
    subject: subjectPerson,
    status: statusMap[detail.status] || 'draft',
    createdAt: detail.createdAt,
    dueDate: detail.closeDate || '',
    completedAt: detail.status === 'completed' ? detail.updatedAt : undefined,
    raters,
    responseRate: detail.responseRate,
    hasResults: detail.computedResults != null,
  };
}

function adaptComputedResults(results: ComputedAssessmentResults, subjectName: string): AssessmentResults {
  return {
    assessmentId: '',
    subjectName,
    completedAt: results.computedAt,
    totalResponses: Object.values(results.responseRateByType).reduce((sum, r) => sum + r.completed, 0),
    responsesByType: Object.fromEntries(
      Object.entries(results.responseRateByType).map(([type, data]) => [type, data.completed])
    ) as Record<RaterType, number>,
    competencyScores: results.competencyScores.map((c) => ({
      competencyId: c.competencyId,
      competencyName: c.competencyName,
      selfScore: c.selfScore ?? undefined,
      managerScore: c.scores.manager,
      peerScore: c.scores.peer,
      directReportScore: c.scores.direct_report,
      averageScore: c.overallAverage,
      gap: c.gap,
    })),
    overallScore: results.overallScore,
    strengths: results.strengths,
    developmentAreas: results.developmentAreas,
  };
}

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<FilterType>('all');
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Determine tenant
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const isAgencyUser = user?.agencyId && !user?.tenantId;
  const activeTenantId = isAgencyUser ? selectedTenantId : user?.tenantId;

  useEffect(() => {
    if (isAgencyUser && tenants && tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [isAgencyUser, tenants, selectedTenantId]);

  // Fetch assessments and stats from API
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAssessments(activeTenantId ?? undefined);
  const { data: statsData } = useAssessmentStats(activeTenantId ?? undefined);
  const { data: templatesData } = useTemplates({ status: 'published' });

  // Fetch selected assessment detail
  const { data: assessmentDetail } = useAssessment(
    activeTenantId ?? undefined,
    selectedAssessmentId ?? undefined
  );

  // Fetch results if assessment is completed
  const { data: resultsData } = useAssessmentResults(
    activeTenantId ?? undefined,
    assessmentDetail?.status === 'completed' ? selectedAssessmentId ?? undefined : undefined
  );

  // Adapt API data to page types
  const assessments: Assessment[] = (assessmentsData?.assessments || []).map(adaptAssessmentListItem);
  const stats: AssessmentStats = statsData || defaultAssessmentStats;
  const templates: AssessmentTemplate[] = (templatesData?.templates || []).map(adaptTemplate);

  // Use fallback mock templates if API returns empty (for non-agency users)
  const displayTemplates = templates.length > 0 ? templates : defaultTemplates;

  const filteredAssessments = assessments.filter((a) => {
    const matchesStatus = activeFilter === 'all' || a.status === activeFilter;
    const matchesType = activeTypeFilter === 'all' || a.assessmentType === activeTypeFilter;
    return matchesStatus && matchesType;
  });

  // Agency user: wait for tenants to load
  if (isAgencyUser && tenantsLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (isAgencyUser && (!tenants || tenants.length === 0)) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">No client tenants found.</p>
      </div>
    );
  }

  // If an assessment is selected, show the detail view
  if (selectedAssessmentId && assessmentDetail) {
    const selectedAssessment = adaptDetailToAssessment(assessmentDetail);
    const template =
      displayTemplates.find((t) => t.id === selectedAssessment.templateId) || displayTemplates[0];

    const results = resultsData
      ? adaptComputedResults(resultsData, selectedAssessment.subject.name)
      : sampleResults;

    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <AssessmentDetailView
          assessment={selectedAssessment}
          template={template || displayTemplates[0]}
          results={results}
          onBack={() => setSelectedAssessmentId(null)}
          tenantId={activeTenantId ?? undefined}
          apiResults={resultsData ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            Assessments
          </h1>
          <p className="text-gray-500">
            {isAgencyUser
              ? 'View and manage assessments across your clients'
              : 'Manage 180 and 360 feedback assessments and view performance insights'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* Tenant selector for agency users */}
          {isAgencyUser && tenants && tenants.length > 0 && (
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedTenantId || ''}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none cursor-pointer"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => setShowChoiceModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-medium text-gray-900">{stats.totalAssessments}</span>
          </div>
          <div className="text-sm text-gray-500">Total Assessments</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-medium text-gray-900">{stats.activeAssessments}</span>
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-medium text-gray-900">
              {stats.completedAssessments}
            </span>
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-medium text-gray-900">{stats.pendingResponses}</span>
          </div>
          <div className="text-sm text-gray-500">Pending Responses</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-medium text-gray-900">
              {stats.averageResponseRate}%
            </span>
          </div>
          <div className="text-sm text-gray-500">Avg Response Rate</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
                  activeFilter === option.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-900 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {typeFilterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTypeFilter(option.id)}
                className={`px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
                  activeTypeFilter === option.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-900 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </div>
      </div>

      {/* Assessments List */}
      {assessmentsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredAssessments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onView={(id) => setSelectedAssessmentId(id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-gray-900 mb-2">No Assessments Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeFilter === 'all'
                ? 'Create your first assessment to gather feedback'
                : `No ${activeFilter} assessments found`}
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => setShowChoiceModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Create Assessment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Choice Modal — entry point for creating a new assessment */}
      <CreateAssessmentChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onCreate={() => { setShowChoiceModal(false); setShowCreateModal(true); }}
      />

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        templates={displayTemplates}
      />
    </div>
  );
}
