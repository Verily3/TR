import type { EmailSetting, ReminderTiming, WizardFormData } from './wizard-types';

export const learningTracks = [
  'Leadership Track',
  'Management Track',
  'Technical Skills',
  'Professional Development',
  'Executive Development',
];

export const timeZones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export const defaultEmailSettings: EmailSetting[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Send a welcome message to participants before the program starts',
    enabled: true,
    timing: '7 days before start',
  },
  {
    id: 'kickoff',
    name: 'Program Kickoff Email',
    description: 'Announcement when the program officially begins',
    enabled: true,
  },
  {
    id: 'weekly-digest',
    name: 'Weekly Progress Digest',
    description: 'Weekly summary of progress and upcoming content',
    enabled: true,
    timing: 'Monday',
  },
  {
    id: 'inactivity',
    name: 'Inactivity Reminder',
    description: 'Reminder sent to inactive participants',
    enabled: true,
    timing: '7 days inactive',
  },
  {
    id: 'milestone',
    name: 'Milestone Celebration Emails',
    description: 'Celebrate progress at 25%, 50%, 75%, and 100% completion',
    enabled: true,
  },
  {
    id: 'completion',
    name: 'Completion Email',
    description: 'Congratulations email when program is completed',
    enabled: true,
  },
  {
    id: 'mentor-summary',
    name: 'Mentor/Manager Summary',
    description: 'Regular progress reports sent to mentors and managers',
    enabled: true,
    timing: 'Weekly',
  },
];

export const defaultBeforeDueReminders: ReminderTiming[] = [
  { id: '2-weeks', label: '2 weeks before due date', enabled: true },
  { id: '1-week', label: '1 week before due date', enabled: true },
  { id: '3-days', label: '3 days before due date', enabled: true },
  { id: '1-day', label: '1 day before due date', enabled: true },
  { id: 'day-of', label: 'Day of due date', enabled: true },
];

export const defaultAfterDueReminders: ReminderTiming[] = [
  { id: '1-day-after', label: '1 day after due date', enabled: false },
  { id: '3-days-after', label: '3 days after due date', enabled: false },
  { id: '1-week-after', label: '1 week after due date', enabled: false },
];

export const defaultWizardFormData: WizardFormData = {
  internalName: '',
  title: '',
  coverImageUrl: '',
  description: '',
  learningTrack: '',
  programType: 'cohort',
  startDate: '',
  endDate: '',
  estimatedDuration: 12,
  timeZone: 'America/New_York',
  allowIndividualPacing: true,
  startOffset: 0,
  deadlineFlexibility: 7,
  objectives: [
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
  ],
  emailSettings: defaultEmailSettings,
  beforeDueReminders: defaultBeforeDueReminders,
  afterDueReminders: defaultAfterDueReminders,
  targetAudience: '',
  prerequisites: '',
  recommendedFor: '',
};
