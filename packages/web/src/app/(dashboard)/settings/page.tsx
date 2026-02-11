'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Puzzle,
  Building2,
  Camera,
  Save,
  Mail,
  Smartphone,
  Key,
  Monitor,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  MessageSquare,
  Calendar,
  HardDrive,
  Users,
  BarChart3,
  ExternalLink,
  CreditCard,
  Check,
  Upload,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/api/useMyProfile';

// ============================================
// Inline Mock Data
// ============================================

const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const defaultNotifications = {
  email: {
    programUpdates: true,
    assessmentReminders: true,
    goalDeadlines: true,
    mentoringReminders: true,
    weeklyDigest: true,
    marketingEmails: false,
  },
  push: {
    programUpdates: true,
    assessmentReminders: true,
    goalDeadlines: false,
    mentoringReminders: true,
    directMessages: true,
  },
  inApp: {
    showBadges: true,
    soundEnabled: false,
    desktopNotifications: true,
  },
};

const defaultSecurity = {
  twoFactorEnabled: true,
  twoFactorMethod: 'authenticator' as const,
  lastPasswordChange: '2024-11-15T10:00:00Z',
  activeSessions: [
    {
      id: 's1',
      device: 'MacBook Pro',
      browser: 'Chrome 120',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.100',
      lastActive: '2025-01-30T14:30:00Z',
      isCurrent: true,
    },
    {
      id: 's2',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.101',
      lastActive: '2025-01-30T10:15:00Z',
      isCurrent: false,
    },
    {
      id: 's3',
      device: 'Windows Desktop',
      browser: 'Edge 120',
      location: 'New York, NY',
      ipAddress: '10.0.0.50',
      lastActive: '2025-01-28T16:45:00Z',
      isCurrent: false,
    },
  ],
  loginHistory: [
    {
      id: 'l1',
      device: 'MacBook Pro',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.100',
      timestamp: '2025-01-30T08:00:00Z',
      success: true,
    },
    {
      id: 'l2',
      device: 'iPhone 15 Pro',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.101',
      timestamp: '2025-01-29T19:30:00Z',
      success: true,
    },
    {
      id: 'l3',
      device: 'Unknown Device',
      location: 'Moscow, Russia',
      ipAddress: '185.220.100.240',
      timestamp: '2025-01-28T03:15:00Z',
      success: false,
    },
    {
      id: 'l4',
      device: 'Windows Desktop',
      location: 'New York, NY',
      ipAddress: '10.0.0.50',
      timestamp: '2025-01-28T09:00:00Z',
      success: true,
    },
  ],
};

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'calendar' | 'storage' | 'hr' | 'analytics';
  connected: boolean;
  connectedAt?: string;
}

const defaultIntegrations: Integration[] = [
  {
    id: 'int1',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    category: 'communication',
    connected: true,
    connectedAt: '2024-10-15T10:00:00Z',
  },
  {
    id: 'int2',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for messaging and meetings',
    category: 'communication',
    connected: false,
  },
  {
    id: 'int3',
    name: 'Google Calendar',
    description: 'Sync coaching sessions and program events',
    category: 'calendar',
    connected: true,
    connectedAt: '2024-09-20T14:30:00Z',
  },
  {
    id: 'int4',
    name: 'Outlook Calendar',
    description: 'Sync with Microsoft Outlook calendar',
    category: 'calendar',
    connected: false,
  },
  {
    id: 'int5',
    name: 'Google Drive',
    description: 'Store and share program resources',
    category: 'storage',
    connected: false,
  },
  {
    id: 'int6',
    name: 'Dropbox',
    description: 'Connect Dropbox for file storage',
    category: 'storage',
    connected: false,
  },
  {
    id: 'int7',
    name: 'Workday',
    description: 'Sync employee data from Workday',
    category: 'hr',
    connected: true,
    connectedAt: '2024-08-01T09:00:00Z',
  },
  {
    id: 'int8',
    name: 'BambooHR',
    description: 'Import employee information from BambooHR',
    category: 'hr',
    connected: false,
  },
  {
    id: 'int9',
    name: 'Tableau',
    description: 'Export analytics data to Tableau',
    category: 'analytics',
    connected: false,
  },
  {
    id: 'int10',
    name: 'Power BI',
    description: 'Connect to Microsoft Power BI for reporting',
    category: 'analytics',
    connected: false,
  },
];

const planFeatures: Record<string, string[]> = {
  free: ['Up to 10 users', 'Basic programs', 'Email support'],
  starter: ['Up to 50 users', 'Programs & Goals', 'Basic analytics', 'Email support'],
  professional: [
    'Up to 200 users',
    'All features',
    'Advanced analytics',
    'Priority support',
    'API access',
  ],
  enterprise: [
    'Unlimited users',
    'All features',
    'Custom integrations',
    'Dedicated support',
    'SLA guarantee',
    'SSO/SAML',
  ],
};

// ============================================
// Tab Types
// ============================================

type Tab = 'profile' | 'notifications' | 'security' | 'integrations' | 'account';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Puzzle className="w-4 h-4" /> },
  { id: 'account', label: 'Account', icon: <Building2 className="w-4 h-4" /> },
];

// ============================================
// Helper Functions
// ============================================

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTimeSince(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// Toggle Component
// ============================================

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-red-600' : 'bg-gray-200'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================
// Main Settings Page
// ============================================

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Settings className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-500 text-sm">Manage your account settings and preferences</p>
          </div>
        </div>
      </header>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>
    </div>
  );
}

// ============================================
// Profile Tab
// ============================================

function ProfileTab() {
  const { user: authUser, refreshUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    department: '',
    phone: '',
    location: '',
    timezone: 'America/New_York',
    language: 'en',
    bio: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile data loads
  useEffect(() => {
    if (profile && !initialized) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        title: profile.title || '',
        department: profile.department || '',
        phone: profile.phone || '',
        location: profile.metadata?.location || '',
        timezone: profile.timezone || 'America/New_York',
        language: profile.metadata?.preferences?.language || 'en',
        bio: profile.metadata?.bio || '',
      });
      setAvatarPreview(profile.avatar || null);
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setAvatarError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarError(`"${file.name}" is not an image file. Please select a JPG, PNG, or GIF.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError(`File is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Use createObjectURL for immediate preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setHasChanges(true);

    // Also read as base64 for saving to DB
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelAvatarChange = () => {
    setAvatarPreview(profile?.avatar || null);
    setPendingAvatar(undefined);
    setAvatarError(null);
    setHasChanges(false);
    setSaveMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setPendingAvatar(null); // null = delete from DB
    setAvatarError(null);
    setHasChanges(true);
    setSaveMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAvatar = async () => {
    if (pendingAvatar === undefined) return;
    try {
      await updateProfile.mutateAsync({ avatar: pendingAvatar });
      setPendingAvatar(undefined);
      setHasChanges(false);
      await refreshUser();
      setSaveMessage('Photo saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save photo. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title || undefined,
        department: formData.department || undefined,
        ...(pendingAvatar !== undefined ? { avatar: pendingAvatar } : {}),
      });
      setPendingAvatar(undefined);
      await refreshUser();
      setHasChanges(false);
      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save profile. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  const displayName = `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          <p className="text-sm text-gray-500">Update your personal information and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profile photo"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl font-medium">
                {getInitials(displayName || 'U')}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-900 mb-1">Upload a new profile photo</p>
            <p className="text-xs text-gray-500 mb-3">JPG, PNG or GIF. Max size 10MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
            />
            {avatarError && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{avatarError}</p>
              </div>
            )}
            {pendingAvatar !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={updateProfile.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {updateProfile.isPending ? 'Saving...' : pendingAvatar === null ? 'Confirm Remove' : 'Save Photo'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAvatarChange}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            {(avatarPreview || profile?.avatar) && pendingAvatar === undefined && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">About You</h3>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            placeholder="Tell us a bit about yourself..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be visible to other users in your organization.
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Language</label>
            <select
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Notifications Tab
// ============================================

function NotificationsTab() {
  const [settings, setSettings] = useState(defaultNotifications);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleToggle = (
    category: 'email' | 'push' | 'inApp',
    key: string,
    value: boolean
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = () => {
    setHasChanges(false);
    setSaveMessage('Notification preferences saved!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-500">Choose how and when you want to be notified</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Mail className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive updates via email</p>
          </div>
        </div>

        <div className="space-y-4">
          {([
            { key: 'programUpdates', label: 'Program Updates', desc: 'New modules, deadlines, and program announcements' },
            { key: 'assessmentReminders', label: 'Assessment Reminders', desc: 'Pending assessments and feedback requests' },
            { key: 'goalDeadlines', label: 'Goal Deadlines', desc: 'Upcoming goal due dates and review reminders' },
            { key: 'mentoringReminders', label: 'Mentoring Reminders', desc: 'Upcoming sessions and prep reminders' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your weekly activity and progress' },
            { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Product updates, tips, and promotional content' },
          ] as const).map((item, index, arr) => (
            <div
              key={item.key}
              className={`flex items-center justify-between py-3 ${
                index < arr.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              <Toggle
                checked={settings.email[item.key]}
                onChange={(v) => handleToggle('email', item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications on your mobile device</p>
          </div>
        </div>

        <div className="space-y-4">
          {([
            { key: 'programUpdates', label: 'Program Updates', desc: 'New content and program changes' },
            { key: 'assessmentReminders', label: 'Assessment Reminders', desc: 'Time-sensitive assessment notifications' },
            { key: 'goalDeadlines', label: 'Goal Deadlines', desc: 'Urgent deadline notifications' },
            { key: 'mentoringReminders', label: 'Mentoring Reminders', desc: 'Session start reminders' },
            { key: 'directMessages', label: 'Direct Messages', desc: 'Messages from coaches and team members' },
          ] as const).map((item, index, arr) => (
            <div
              key={item.key}
              className={`flex items-center justify-between py-3 ${
                index < arr.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              <Toggle
                checked={settings.push[item.key]}
                onChange={(v) => handleToggle('push', item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* In-App Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">In-App Preferences</h3>
            <p className="text-sm text-gray-500">Configure how notifications appear in the app</p>
          </div>
        </div>

        <div className="space-y-4">
          {([
            { key: 'showBadges', label: 'Show Badge Counts', desc: 'Display unread notification counts' },
            { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for new notifications' },
            { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Show browser notifications when the app is in background' },
          ] as const).map((item, index, arr) => (
            <div
              key={item.key}
              className={`flex items-center justify-between py-3 ${
                index < arr.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
              <Toggle
                checked={settings.inApp[item.key]}
                onChange={(v) => handleToggle('inApp', item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Security Tab
// ============================================

function SecurityTab() {
  const [security] = useState(defaultSecurity);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState(defaultSecurity.activeSessions);

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters.');
      return;
    }
    setPasswordMessage('Password changed successfully!');
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500">Manage your account security and login settings</p>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Key className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500 mt-1">
                Last changed {getTimeSince(security.lastPasswordChange)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(security.lastPasswordChange)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Change Password
          </button>
        </div>

        {passwordMessage && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            passwordMessage.includes('successfully')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {passwordMessage}
          </div>
        )}

        {showPasswordForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordMessage(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                security.twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              <Shield
                className={`w-6 h-6 ${
                  security.twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-medium text-gray-900">
                  Two-Factor Authentication
                </h3>
                {security.twoFactorEnabled ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {security.twoFactorEnabled
                  ? `Using ${
                      security.twoFactorMethod === 'authenticator'
                        ? 'Authenticator App'
                        : security.twoFactorMethod === 'sms'
                        ? 'SMS'
                        : 'Email'
                    }`
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>
          <button
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              security.twoFactorEnabled
                ? 'border border-gray-200 text-gray-900 hover:bg-gray-50'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {security.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
          </button>
        </div>

        {!security.twoFactorEnabled && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Your account is less secure</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Two-factor authentication adds an extra layer of security. We strongly recommend enabling it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-500">Devices currently logged into your account</p>
          </div>
          <button className="text-sm text-red-600 hover:underline">
            Sign out all other sessions
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg ${
                session.isCurrent
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      session.isCurrent ? 'bg-green-100' : 'bg-gray-50'
                    }`}
                  >
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{session.device}</span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{session.browser}</div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeSince(session.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Login Activity</h3>
          <p className="text-sm text-gray-500">Recent sign-in attempts to your account</p>
        </div>

        <div className="space-y-2">
          {security.loginHistory.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
            >
              <div className="flex items-center gap-3">
                {event.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div>
                  <div className="text-sm text-gray-900">{event.device}</div>
                  <div className="text-xs text-gray-500">
                    {event.location} &middot; {event.ipAddress}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    event.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {event.success ? 'Successful' : 'Failed'}
                </div>
                <div className="text-xs text-gray-500">{formatDate(event.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Integrations Tab
// ============================================

const categoryIcons: Record<string, React.ReactNode> = {
  communication: <MessageSquare className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
  hr: <Users className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  communication: 'Communication',
  calendar: 'Calendar',
  storage: 'Storage',
  hr: 'HR Systems',
  analytics: 'Analytics',
};

function IntegrationsTab() {
  const [integrations, setIntegrations] = useState(defaultIntegrations);
  const [filter, setFilter] = useState<string>('all');

  const categories = [...new Set(integrations.map((i) => i.category))];

  const filteredIntegrations =
    filter === 'all'
      ? integrations
      : filter === 'connected'
      ? integrations.filter((i) => i.connected)
      : integrations.filter((i) => i.category === filter);

  const connectedCount = integrations.filter((i) => i.connected).length;

  const handleToggleConnection = (integrationId: string) => {
    setIntegrations(
      integrations.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              connected: !i.connected,
              connectedAt: !i.connected ? new Date().toISOString() : undefined,
            }
          : i
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">Connect third-party services to enhance your workflow</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-gray-900">{integrations.length}</div>
          <div className="text-sm text-gray-500">Available Integrations</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
          <div className="text-sm text-gray-500">Connected</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-gray-500">{integrations.length - connectedCount}</div>
          <div className="text-sm text-gray-500">Available</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('connected')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'connected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Connected ({connectedCount})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              filter === category
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {categoryIcons[category]}
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Connected Integrations */}
      {(filter === 'all' || filter === 'connected') && connectedCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Integrations</h3>
          <div className="space-y-3">
            {integrations
              .filter((i) => i.connected)
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onToggle={handleToggleConnection}
                />
              ))}
          </div>
        </div>
      )}

      {/* Available Integrations by Category */}
      {filter !== 'connected' &&
        categories.map((category) => {
          const categoryIntegrations = filteredIntegrations.filter(
            (i) => i.category === category && (filter === 'all' ? !i.connected : true)
          );
          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {categoryIcons[category]}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {categoryLabels[category]}
                </h3>
              </div>
              <div className="space-y-3">
                {categoryIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onToggle={handleToggleConnection}
                  />
                ))}
              </div>
            </div>
          );
        })}

      {/* Request Integration */}
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-5">
        <div className="text-center py-4">
          <h3 className="font-medium text-gray-900 mb-2">Need a different integration?</h3>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;re always adding new integrations. Let us know what you need.
          </p>
          <button className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Request Integration
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onToggle,
}: {
  integration: Integration;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        integration.connected
          ? 'border-green-200 bg-green-50/50'
          : 'border-gray-200 hover:border-red-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              integration.connected ? 'bg-green-100' : 'bg-gray-50'
            }`}
          >
            {categoryIcons[integration.category]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{integration.name}</h4>
              {integration.connected && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
            {integration.connected && integration.connectedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Connected {formatDateShort(integration.connectedAt)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggle(integration.id)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors shrink-0 ${
            integration.connected
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {integration.connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Account Tab
// ============================================

function AccountTab() {
  const [orgData, setOrgData] = useState({
    name: 'Acme Corporation',
    domain: 'acme.com',
    industry: 'Technology',
    size: '500-1000',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const billing = {
    plan: 'professional',
    billingCycle: 'annual',
    nextBillingDate: '2025-03-01',
    paymentMethod: {
      brand: 'Visa',
      last4: '4242',
    },
    usage: {
      users: 156,
      usersLimit: 200,
      storage: 45,
      storageLimit: 100,
    },
  };

  const handleChange = (field: string, value: string) => {
    setOrgData({ ...orgData, [field]: value });
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = () => {
    setHasChanges(false);
    setSaveMessage('Account settings saved!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportData = () => {
    setExportMessage('Your data export has been queued. You will receive an email when it is ready.');
    setTimeout(() => setExportMessage(null), 5000);
  };

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-red-50 text-red-600',
  };

  const invoices = [
    { date: 'Jan 1, 2025', amount: '$499.00', status: 'Paid' },
    { date: 'Dec 1, 2024', amount: '$499.00', status: 'Paid' },
    { date: 'Nov 1, 2024', amount: '$499.00', status: 'Paid' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500">Manage your organization settings and billing</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <Building2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
        </div>

        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center text-2xl font-bold text-gray-500">
              {orgData.name.slice(0, 2).toUpperCase()}
            </div>
            <button className="absolute -bottom-2 -right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
              <Upload className="w-3 h-3" />
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Organization Logo</p>
            <p className="text-xs text-gray-500">PNG, JPG or SVG. Max size 1MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Organization Name</label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Domain</label>
            <input
              type="text"
              value={orgData.domain}
              onChange={(e) => handleChange('domain', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Industry</label>
            <select
              value={orgData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Company Size</label>
            <select
              value={orgData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="1-50">1-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500-1000">500-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
            <select
              value={orgData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Date Format</label>
            <select
              value={orgData.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing & Subscription */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Billing & Subscription</h3>
        </div>

        {/* Current Plan */}
        <div className="p-4 border border-gray-200 rounded-lg mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${planColors[billing.plan]}`}
                >
                  {billing.plan}
                </span>
                <span className="text-sm text-gray-500">
                  Billed {billing.billingCycle}
                </span>
              </div>
              <ul className="space-y-1">
                {planFeatures[billing.plan].map((feature, i) => (
                  <li key={i} className="text-sm text-gray-500 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Users</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{billing.usage.users}</span>
              <span className="text-sm text-gray-500 mb-1">/ {billing.usage.usersLimit}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-red-600 rounded-full"
                style={{
                  width: `${(billing.usage.users / billing.usage.usersLimit) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Storage</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900">{billing.usage.storage} GB</span>
              <span className="text-sm text-gray-500 mb-1">/ {billing.usage.storageLimit} GB</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(billing.usage.storage / billing.usage.storageLimit) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {billing.paymentMethod.brand} ending in {billing.paymentMethod.last4}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Next billing: {formatDateShort(billing.nextBillingDate)}
              </div>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Update
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
          <button className="text-sm text-red-600 hover:underline">View All</button>
        </div>
        <div className="space-y-2">
          {invoices.map((invoice, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-200 last:border-0 gap-2"
            >
              <div>
                <div className="text-sm text-gray-900">{invoice.date}</div>
                <div className="text-xs text-gray-500">Professional Plan - Monthly</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">{invoice.amount}</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {invoice.status}
                </span>
                <button className="text-sm text-red-600 hover:underline">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <p className="text-sm text-gray-500 mb-4">
          Download a copy of all your data. The export will include your profile, goals, program progress, assessment results, and mentoring history.
        </p>
        {exportMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
            {exportMessage}
          </div>
        )}
        <button
          onClick={handleExportData}
          className="px-4 py-2 border border-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export All Data
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Delete Account</div>
              <div className="text-sm text-gray-500">
                Permanently delete your account and all associated data. This action cannot be undone.
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Are you absolutely sure?</h4>
                  <p className="text-xs text-red-700 mt-1">
                    This will permanently delete your account, all organizations, programs, goals, and data.
                    Type <strong>delete my account</strong> to confirm.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete my account' to confirm"
                className="w-full max-w-md px-4 py-2 border border-red-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3"
              />
              <div className="flex items-center gap-3">
                <button
                  disabled={deleteConfirmText !== 'delete my account'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Permanently Delete Account
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
