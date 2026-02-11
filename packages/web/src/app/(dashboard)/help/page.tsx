'use client';

import { useState } from 'react';
import {
  Search,
  HelpCircle,
  BookOpen,
  Target,
  Users,
  ClipboardList,
  UserCircle,
  Settings,
  CreditCard,
  Plug,
  Wrench,
  Rocket,
  MessageSquare,
  Clock,
  Eye,
  ThumbsUp,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Send,
  Ticket,
  X,
  Paperclip,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArticleCategory =
  | 'getting-started'
  | 'programs'
  | 'goals'
  | 'coaching'
  | 'assessments'
  | 'people'
  | 'settings'
  | 'billing'
  | 'integrations'
  | 'troubleshooting';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
type TicketCategory = 'bug' | 'feature_request' | 'question' | 'account' | 'billing' | 'other';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  readingTime: number;
  relatedArticles?: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: ArticleCategory;
  order: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'support';
  senderName: string;
  message: string;
  timestamp: string;
}

interface HelpCategoryItem {
  id: ArticleCategory;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const helpCategories: HelpCategoryItem[] = [
  { id: 'getting-started', name: 'Getting Started', description: 'Learn the basics and set up your account', icon: 'Rocket', articleCount: 8 },
  { id: 'programs', name: 'Programs & Learning', description: 'Manage and participate in learning programs', icon: 'BookOpen', articleCount: 12 },
  { id: 'goals', name: 'Goals & Planning', description: 'Set, track, and achieve your objectives', icon: 'Target', articleCount: 9 },
  { id: 'coaching', name: 'Mentoring', description: 'Schedule sessions and manage mentoring relationships', icon: 'Users', articleCount: 7 },
  { id: 'assessments', name: '360 Assessments', description: 'Create and complete feedback assessments', icon: 'ClipboardList', articleCount: 10 },
  { id: 'people', name: 'Team & People', description: 'Manage your team and organization', icon: 'UserCircle', articleCount: 6 },
  { id: 'settings', name: 'Account Settings', description: 'Configure your profile and preferences', icon: 'Settings', articleCount: 8 },
  { id: 'billing', name: 'Billing & Subscriptions', description: 'Manage payments and subscription plans', icon: 'CreditCard', articleCount: 5 },
  { id: 'integrations', name: 'Integrations', description: 'Connect with third-party tools', icon: 'Plug', articleCount: 6 },
  { id: 'troubleshooting', name: 'Troubleshooting', description: 'Solve common issues and errors', icon: 'Wrench', articleCount: 11 },
];

const articles: HelpArticle[] = [
  {
    id: 'a1',
    title: 'Getting Started with Transformation OS',
    slug: 'getting-started-guide',
    excerpt: 'A comprehensive guide to help you navigate and make the most of the platform',
    content: `Getting Started with Transformation OS

Welcome to Transformation OS! This guide will walk you through the essential features and help you get started on your transformation journey.

Setting Up Your Profile

1. Navigate to Settings > Profile
2. Upload your profile photo
3. Fill in your job title and department
4. Set your timezone and language preferences

Exploring the Dashboard

Your dashboard is your home base. Here you'll find:
- Quick Actions: Fast access to common tasks
- Progress Overview: Track your goals and programs
- Upcoming Sessions: See your scheduled coaching meetings
- Recent Activity: Stay updated on team activities

Your First Steps

1. Complete your profile setup
2. Set your first goal
3. Explore available programs
4. Connect with your manager or mentor

Need help? Contact our support team anytime.`,
    category: 'getting-started',
    tags: ['basics', 'setup', 'profile', 'dashboard'],
    views: 1523,
    helpful: 234,
    notHelpful: 12,
    createdAt: '2024-01-15',
    updatedAt: '2025-01-20',
    readingTime: 5,
    relatedArticles: ['a2', 'a3'],
  },
  {
    id: 'a2',
    title: 'How to Set and Track Goals',
    slug: 'setting-tracking-goals',
    excerpt: 'Learn how to create SMART goals and monitor your progress effectively',
    content: `How to Set and Track Goals

Setting clear goals is essential for your development. Here's how to make the most of the goal-setting features.

Creating a New Goal

1. Navigate to Planning & Goals
2. Click "Create Goal"
3. Define your objective using the SMART framework
4. Set milestones and deadlines
5. Assign reviewers if needed

The SMART Framework

- Specific: Clearly define what you want to achieve
- Measurable: Include metrics to track progress
- Achievable: Set realistic targets
- Relevant: Align with your role and career path
- Time-bound: Set clear deadlines

Tracking Progress

Use the progress tracker to:
- Log updates and achievements
- Upload supporting evidence
- Request feedback from managers
- Celebrate milestones`,
    category: 'goals',
    tags: ['goals', 'planning', 'SMART', 'tracking'],
    views: 892,
    helpful: 156,
    notHelpful: 8,
    createdAt: '2024-02-10',
    updatedAt: '2025-01-15',
    readingTime: 4,
    relatedArticles: ['a1', 'a4'],
  },
  {
    id: 'a3',
    title: 'Navigating Learning Programs',
    slug: 'navigating-programs',
    excerpt: 'Discover how to enroll in programs and track your learning journey',
    content: `Navigating Learning Programs

Learning programs are structured courses designed to help you develop specific skills.

Finding Programs

1. Go to the Programs page
2. Browse by category or search
3. Filter by duration, difficulty, or topic
4. Read program descriptions and reviews

Enrolling in a Program

Click "Enroll" on any program card to join. You'll receive:
- Access to all program content
- Progress tracking
- Completion certificates
- Mentor assignments (if applicable)

Completing Modules

Each program contains modules with:
- Video lessons
- Reading materials
- Quizzes and assessments
- Practical assignments`,
    category: 'programs',
    tags: ['programs', 'learning', 'enrollment', 'modules'],
    views: 756,
    helpful: 134,
    notHelpful: 5,
    createdAt: '2024-03-05',
    updatedAt: '2025-01-10',
    readingTime: 3,
    relatedArticles: ['a1', 'a5'],
  },
  {
    id: 'a4',
    title: 'Scheduling Mentoring Sessions',
    slug: 'scheduling-mentoring',
    excerpt: 'Learn how to book, prepare for, and get the most out of mentoring sessions',
    content: `Scheduling Mentoring Sessions

Mentoring sessions are 1:1 meetings with mentors to support your development.

Booking a Session

1. Navigate to Mentoring
2. Click "New Session"
3. Select your mentor
4. Choose available time slots
5. Add agenda items or discussion topics

Preparing for Sessions

Use session prep to:
- Reflect on recent wins and challenges
- List topics you want to discuss
- Set intentions for the meeting
- Review notes from previous sessions

After the Session

- Review session notes
- Complete action items
- Provide feedback
- Schedule follow-up if needed`,
    category: 'coaching',
    tags: ['mentoring', 'sessions', 'mentoring', 'scheduling'],
    views: 543,
    helpful: 98,
    notHelpful: 3,
    createdAt: '2024-04-12',
    updatedAt: '2025-01-05',
    readingTime: 4,
    relatedArticles: ['a2', 'a5'],
  },
  {
    id: 'a5',
    title: 'Understanding 360 Assessments',
    slug: 'understanding-360-assessments',
    excerpt: 'A complete guide to 360-degree feedback assessments and how to use them',
    content: `Understanding 360 Assessments

360 assessments gather feedback from multiple perspectives to provide comprehensive insights.

What is a 360 Assessment?

A 360-degree assessment collects feedback from:
- Self-evaluation
- Manager feedback
- Peer reviews
- Direct report feedback

Participating as a Rater

When invited to provide feedback:
1. Complete the assessment honestly
2. Provide specific examples
3. Focus on behaviors, not personality
4. Submit before the deadline

Reviewing Your Results

Your results will show:
- Scores across competencies
- Gap analysis (self vs. others)
- Strengths and development areas
- Trend comparisons over time`,
    category: 'assessments',
    tags: ['assessments', '360', 'feedback', 'reviews'],
    views: 678,
    helpful: 112,
    notHelpful: 6,
    createdAt: '2024-05-20',
    updatedAt: '2024-12-15',
    readingTime: 5,
    relatedArticles: ['a2', 'a4'],
  },
  {
    id: 'a6',
    title: 'Managing Notification Settings',
    slug: 'notification-settings',
    excerpt: 'Customize how and when you receive notifications',
    content: `Managing Notification Settings

Control your notification preferences to stay informed without being overwhelmed.

Email Notifications

Choose your email frequency:
- Instant: Receive emails immediately
- Daily Digest: One summary per day
- Weekly Digest: One summary per week
- Never: Disable email notifications

Push Notifications

Enable or disable push notifications for:
- Session reminders
- Goal deadlines
- New feedback
- Program updates

Quiet Hours

Set quiet hours to pause notifications:
1. Go to Settings > Notifications
2. Enable Quiet Hours
3. Set start and end times
4. Choose your timezone`,
    category: 'settings',
    tags: ['notifications', 'settings', 'preferences', 'email'],
    views: 345,
    helpful: 67,
    notHelpful: 2,
    createdAt: '2024-06-10',
    updatedAt: '2024-11-20',
    readingTime: 3,
    relatedArticles: ['a1', 'a7'],
  },
  {
    id: 'a7',
    title: 'Troubleshooting Login Issues',
    slug: 'login-issues',
    excerpt: 'Solutions for common login problems and account access issues',
    content: `Troubleshooting Login Issues

Having trouble logging in? Here are solutions to common problems.

Forgot Password

1. Click "Forgot Password" on the login page
2. Enter your email address
3. Check your inbox for reset link
4. Create a new password

Account Locked

Your account may be locked after multiple failed attempts:
- Wait 30 minutes and try again
- Or contact support for immediate unlock

Browser Issues

Try these steps:
1. Clear your browser cache
2. Disable browser extensions
3. Try a different browser
4. Check for JavaScript errors

Still Having Issues?

Contact support with:
- Your email address
- Error messages (if any)
- Browser and device info`,
    category: 'troubleshooting',
    tags: ['login', 'password', 'access', 'troubleshooting'],
    views: 1234,
    helpful: 189,
    notHelpful: 15,
    createdAt: '2024-07-05',
    updatedAt: '2025-01-25',
    readingTime: 4,
    relatedArticles: ['a6', 'a8'],
  },
  {
    id: 'a8',
    title: 'Connecting Integrations',
    slug: 'connecting-integrations',
    excerpt: 'How to connect Transformation OS with your favorite tools',
    content: `Connecting Integrations

Enhance your experience by connecting with external tools.

Available Integrations

- Slack: Get notifications in your workspace
- Google Calendar: Sync sessions and deadlines
- Microsoft Teams: Collaborate with your team
- Zoom: Join coaching sessions directly

Setting Up an Integration

1. Go to Settings > Integrations
2. Find the integration you want
3. Click "Connect"
4. Authorize the connection
5. Configure preferences

Managing Connections

You can:
- View connected apps
- Update permissions
- Disconnect integrations
- Troubleshoot sync issues`,
    category: 'integrations',
    tags: ['integrations', 'slack', 'calendar', 'zoom'],
    views: 456,
    helpful: 78,
    notHelpful: 4,
    createdAt: '2024-08-15',
    updatedAt: '2024-12-10',
    readingTime: 3,
    relatedArticles: ['a6', 'a7'],
  },
];

const faqs: FAQ[] = [
  { id: 'f1', question: 'How do I reset my password?', answer: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions in the reset email. The link expires after 24 hours.", category: 'troubleshooting', order: 1 },
  { id: 'f2', question: 'Can I change my email address?', answer: "Yes, go to Settings > Profile > Account and click 'Change Email'. You'll need to verify the new email address before the change takes effect.", category: 'settings', order: 2 },
  { id: 'f3', question: 'How do I enroll in a learning program?', answer: "Navigate to the Programs page, browse available programs, and click 'Enroll' on the program you want to join. Some programs may require manager approval.", category: 'programs', order: 3 },
  { id: 'f4', question: 'What happens when I complete a program?', answer: "Upon completion, you'll receive a certificate of completion, your progress will be recorded in your profile, and any associated goals will be updated.", category: 'programs', order: 4 },
  { id: 'f5', question: 'How often should I update my goals?', answer: 'We recommend updating goal progress at least weekly. Set up reminders in your notification preferences to stay on track.', category: 'goals', order: 5 },
  { id: 'f6', question: 'Can I reschedule a mentoring session?', answer: "Yes, you can reschedule sessions up to 24 hours before the scheduled time. Go to Mentoring, find the session, and click 'Reschedule'.", category: 'coaching', order: 6 },
  { id: 'f7', question: 'Who can see my 360 assessment results?', answer: "By default, only you and your direct manager can see your results. Some assessments may be shared with HR or coaches based on your organization's settings.", category: 'assessments', order: 7 },
  { id: 'f8', question: 'How do I invite team members?', answer: "Go to People > Invite Members, enter their email addresses, select their role, and send invitations. They'll receive an email to create their account.", category: 'people', order: 8 },
  { id: 'f9', question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption, regular security audits, and comply with GDPR and SOC 2 requirements. Your data is never shared without consent.', category: 'settings', order: 9 },
  { id: 'f10', question: 'How do I cancel my subscription?', answer: 'Contact your account administrator or our support team to discuss subscription changes. We offer flexible options including plan downgrades.', category: 'billing', order: 10 },
];

const defaultTickets: SupportTicket[] = [
  {
    id: 't1',
    subject: 'Unable to access program materials',
    description: 'I enrolled in Leadership Fundamentals but cannot view the video content in Module 3.',
    category: 'bug',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2025-01-28T10:30:00Z',
    updatedAt: '2025-01-29T14:15:00Z',
    assignedTo: 'Support Team',
    messages: [
      { id: 'm1', ticketId: 't1', sender: 'user', senderName: 'John Doe', message: 'I enrolled in Leadership Fundamentals but cannot view the video content in Module 3. The video player shows a loading spinner but never loads.', timestamp: '2025-01-28T10:30:00Z' },
      { id: 'm2', ticketId: 't1', sender: 'support', senderName: 'Sarah (Support)', message: "Hi John, thank you for reporting this issue. We've identified a temporary problem with video streaming and our team is working on a fix. In the meantime, try clearing your browser cache or using a different browser.", timestamp: '2025-01-29T14:15:00Z' },
    ],
  },
  {
    id: 't2',
    subject: 'Request for additional user seats',
    description: 'We need to add 5 more users to our team plan.',
    category: 'account',
    priority: 'medium',
    status: 'resolved',
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-21T11:30:00Z',
    assignedTo: 'Billing Team',
    messages: [
      { id: 'm3', ticketId: 't2', sender: 'user', senderName: 'John Doe', message: 'We need to add 5 more users to our team plan. Can you help with this upgrade?', timestamp: '2025-01-20T09:00:00Z' },
      { id: 'm4', ticketId: 't2', sender: 'support', senderName: 'Mike (Billing)', message: "Hi John, I've added 5 additional seats to your account. The prorated charge will appear on your next invoice. You can now invite new team members from the People section.", timestamp: '2025-01-21T11:30:00Z' },
    ],
  },
];

const categoryConfig: Record<ArticleCategory, { bg: string; text: string }> = {
  'getting-started': { bg: 'bg-purple-100', text: 'text-purple-700' },
  programs: { bg: 'bg-blue-100', text: 'text-blue-700' },
  goals: { bg: 'bg-green-100', text: 'text-green-700' },
  coaching: { bg: 'bg-orange-100', text: 'text-orange-700' },
  assessments: { bg: 'bg-pink-100', text: 'text-pink-700' },
  people: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  settings: { bg: 'bg-gray-100', text: 'text-gray-700' },
  billing: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  integrations: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  troubleshooting: { bg: 'bg-red-100', text: 'text-red-700' },
};

const ticketStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  waiting: { label: 'Waiting', bg: 'bg-purple-100', text: 'text-purple-700' },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700' },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-700' },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  BookOpen,
  Target,
  Users,
  ClipboardList,
  UserCircle,
  Settings,
  CreditCard,
  Plug,
  Wrench,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FAQAccordion({ items }: { items: FAQ[] }) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="text-center py-8">
          <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
          <p className="text-gray-500">No FAQs found for this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((faq) => {
        const isOpen = openIds.includes(faq.id);
        return (
          <div
            key={faq.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-gray-500">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SupportTicketModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: Partial<SupportTicket>) => void;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('question');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    // Simulate async
    setTimeout(() => {
      onSubmit({ subject, description, category, priority, status: 'open' });
      setIsSubmitting(false);
      setSubject('');
      setDescription('');
      setCategory('question');
      setPriority('medium');
      onClose();
    }, 500);
  };

  const categoryOptions: { value: TicketCategory; label: string }[] = [
    { value: 'question', label: 'Question' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'account', label: 'Account' },
    { value: 'billing', label: 'Billing' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
            <p className="text-sm text-gray-500">We'll get back to you within 24 hours</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              What do you need help with?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCategory(option.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === option.value
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-600/20'
                      : 'border-gray-200 hover:border-red-600/30'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide as much detail as possible..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="low">Low - General question, no rush</option>
              <option value="medium">Medium - Need help soon</option>
              <option value="high">High - Blocking my work</option>
              <option value="urgent">Urgent - Critical issue</option>
            </select>
          </div>

          {/* Attachment hint */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Paperclip className="w-4 h-4" />
            <span>You can add attachments after creating the ticket</span>
          </div>

          {/* Tips */}
          <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Include any error messages, screenshots, or steps to reproduce the issue for faster resolution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

type ViewMode = 'home' | 'category' | 'article' | 'tickets' | 'faq';

export default function HelpPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>(defaultTickets);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const popularArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewCategory = (categoryId: ArticleCategory) => {
    setSelectedCategory(categoryId);
    setViewMode('category');
  };

  const handleViewArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setViewMode('article');
  };

  const handleBack = () => {
    if (viewMode === 'article') {
      setViewMode(selectedCategory ? 'category' : 'home');
      setSelectedArticle(null);
    } else {
      setViewMode('home');
      setSelectedCategory(null);
      setSearchTerm('');
    }
  };

  const handleCreateTicket = (ticket: Partial<SupportTicket>) => {
    const newTicket: SupportTicket = {
      id: `t${tickets.length + 1}`,
      subject: ticket.subject || '',
      description: ticket.description || '',
      category: (ticket.category as TicketCategory) || 'question',
      priority: (ticket.priority as TicketPriority) || 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `m${Date.now()}`,
          ticketId: `t${tickets.length + 1}`,
          sender: 'user',
          senderName: 'You',
          message: ticket.description || '',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setTickets((prev) => [newTicket, ...prev]);
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ─── Article View ────────────────────────────────────────────────────────

  if (viewMode === 'article' && selectedArticle) {
    const relatedArticles = (selectedArticle.relatedArticles
      ?.map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) || []) as HelpArticle[];

    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {selectedCategory ? 'Category' : 'Help Center'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <article>
              <div className="mb-6">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                    categoryConfig[selectedArticle.category].bg
                  } ${categoryConfig[selectedArticle.category].text}`}
                >
                  {helpCategories.find((c) => c.id === selectedArticle.category)?.name}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {selectedArticle.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedArticle.readingTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedArticle.views.toLocaleString()} views
                  </span>
                  <span>Updated {formatDate(selectedArticle.updatedAt)}</span>
                </div>
              </div>

              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {selectedArticle.content}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">
                  Was this article helpful?
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-900">
                    <ThumbsUp className="w-4 h-4" />
                    Yes ({selectedArticle.helpful})
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-900">
                    <ThumbsUp className="w-4 h-4 rotate-180" />
                    No ({selectedArticle.notHelpful})
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div className="space-y-6">
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-4">Related Articles</h3>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleViewArticle(article)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {article.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {article.readingTime} min read
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Need More Help?</h3>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={handleCreateTicket}
        />
      </div>
    );
  }

  // ─── Category View ───────────────────────────────────────────────────────

  if (viewMode === 'category' && selectedCategory) {
    const category = helpCategories.find((c) => c.id === selectedCategory);
    const categoryArticles = filteredArticles.filter(
      (a) => a.category === selectedCategory
    );
    const categoryFAQs = faqs.filter((f) => f.category === selectedCategory);

    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl ${categoryConfig[selectedCategory].bg}`}>
              {(() => {
                const Icon = iconMap[category?.icon || 'HelpCircle'] || HelpCircle;
                return <Icon className={`w-6 h-6 ${categoryConfig[selectedCategory].text}`} />;
              })()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {category?.name}
              </h1>
              <p className="text-gray-500">{category?.description}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">
                Articles ({categoryArticles.length})
              </h3>
              <div className="space-y-3">
                {categoryArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleViewArticle(article)}
                    className="w-full flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-red-600/30 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{article.readingTime} min read</span>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 ml-4" />
                  </button>
                ))}
                {categoryArticles.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No articles found in this category.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {categoryFAQs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-4">Frequently Asked</h3>
                <FAQAccordion items={categoryFAQs} />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Still Need Help?</h3>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={handleCreateTicket}
        />
      </div>
    );
  }

  // ─── Tickets View ────────────────────────────────────────────────────────

  if (viewMode === 'tickets') {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        {/* Success banner */}
        {ticketSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">Your support ticket has been submitted successfully. We'll get back to you within 24 hours.</p>
          </div>
        )}

        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              My Support Tickets
            </h1>
            <p className="text-gray-500">Track and manage your support requests</p>
          </div>
          <button
            onClick={() => setShowTicketModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Send className="w-4 h-4" />
            New Ticket
          </button>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => {
              const statusConf = ticketStatusConfig[ticket.status];
              return (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusConf.bg} ${statusConf.text}`}
                    >
                      {statusConf.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>#{ticket.id}</span>
                    <span>Created {formatDate(ticket.createdAt)}</span>
                    <span>{ticket.messages.length} messages</span>
                  </div>
                </div>
              );
            })}
            {tickets.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No support tickets yet. Create one if you need help.</p>
              </div>
            )}
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={handleCreateTicket}
        />
      </div>
    );
  }

  // ─── FAQ View ────────────────────────────────────────────────────────────

  if (viewMode === 'faq') {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        <header className="mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500">Quick answers to common questions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <FAQAccordion items={faqs} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Can't find your answer?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Our support team is here to help you with any questions not covered in the FAQ.
              </p>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Browse by Topic</h3>
              <div className="space-y-2">
                {helpCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleViewCategory(cat.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm text-gray-900">{cat.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={handleCreateTicket}
        />
      </div>
    );
  }

  // ─── Home View (default) ─────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Success banner */}
      {ticketSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">Your support ticket has been submitted successfully. We'll get back to you within 24 hours.</p>
        </div>
      )}

      {/* Header */}
      <header className="text-center mb-8">
        <div className="p-3 bg-red-50 rounded-2xl inline-flex mb-4">
          <HelpCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          How can we help you?
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Search our knowledge base or browse categories below
        </p>
      </header>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search for articles, guides, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        {searchTerm && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-3">
              {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for &quot;{searchTerm}&quot;
            </p>
            <div className="space-y-2">
              {filteredArticles.slice(0, 5).map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleViewArticle(article)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-red-600/30 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">{article.title}</div>
                    <div className="text-sm text-gray-500 truncate">{article.excerpt}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 ml-3" />
                </button>
              ))}
              {filteredArticles.length === 0 && (
                <p className="text-gray-500 text-center py-4">No articles match your search. Try different keywords or contact support.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
        <button
          onClick={() => setShowTicketModal(true)}
          className="p-4 border border-gray-200 rounded-xl hover:border-red-600/30 transition-colors text-center"
        >
          <MessageSquare className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <div className="font-medium text-gray-900">Contact Support</div>
          <div className="text-sm text-gray-500">Get help from our team</div>
        </button>
        <button
          onClick={() => setViewMode('tickets')}
          className="p-4 border border-gray-200 rounded-xl hover:border-red-600/30 transition-colors text-center"
        >
          <Ticket className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="font-medium text-gray-900">My Tickets</div>
          <div className="text-sm text-gray-500">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
        </button>
        <button
          onClick={() => setViewMode('faq')}
          className="p-4 border border-gray-200 rounded-xl hover:border-red-600/30 transition-colors text-center"
        >
          <HelpCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="font-medium text-gray-900">FAQs</div>
          <div className="text-sm text-gray-500">Quick answers</div>
        </button>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {helpCategories.map((category) => {
            const Icon = iconMap[category.icon] || HelpCircle;
            const config = categoryConfig[category.id];
            return (
              <button
                key={category.id}
                onClick={() => handleViewCategory(category.id)}
                className="p-4 border border-gray-200 rounded-xl hover:border-red-600/30 transition-all text-center group"
              >
                <div
                  className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${config.text}`} />
                </div>
                <div className="font-medium text-gray-900 text-sm">
                  {category.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {category.articleCount} articles
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Popular Articles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {popularArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleViewArticle(article)}
              className="p-4 border border-gray-200 rounded-xl hover:border-red-600/30 transition-colors text-left"
            >
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                  categoryConfig[article.category].bg
                } ${categoryConfig[article.category].text}`}
              >
                {helpCategories.find((c) => c.id === article.category)?.name}
              </span>
              <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>
          <button
            onClick={() => setViewMode('faq')}
            className="text-sm text-red-600 hover:underline"
          >
            View All
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <FAQAccordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
