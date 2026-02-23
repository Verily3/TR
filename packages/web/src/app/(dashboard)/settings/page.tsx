'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Puzzle,
  Building2,
  Save,
  Mail,
  Smartphone,
  Key,
  Monitor,
  MapPin,
  Clock,
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
  Upload,
  Download,
  Trash2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/api/useMyProfile';
import { api } from '@/lib/api';
import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/api/useNotifications';
import {
  useActiveSessions,
  useRevokeSession,
  useChangePassword,
} from '@/hooks/api/useAuthSecurity';

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

// ============================================
// Tab Types
// ============================================

type Tab = 'profile' | 'notifications' | 'security' | 'integrations' | 'account' | 'permissions';

const baseTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Puzzle className="w-4 h-4" /> },
  { id: 'account', label: 'Account', icon: <Building2 className="w-4 h-4" /> },
];

// ============================================
// Helper Functions
// ============================================

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
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
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user } = useAuth();
  const router = useRouter();
  const roleLevel = user?.roleLevel ?? 0;

  // Build tabs — add Permissions only for elevated roles
  const tabs = [
    ...baseTabs,
    ...(roleLevel >= 70
      ? [
          {
            id: 'permissions' as Tab,
            label: 'Permissions',
            icon: <ShieldCheck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const handleTabClick = (tabId: Tab) => {
    if (tabId === 'permissions') {
      router.push('/settings/permissions');
      return;
    }
    setActiveTab(tabId);
  };

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
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-white'
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
  const { refreshUser } = useAuth();
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

  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Immediate preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload file to server
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.uploadFile<{ key: string; url: string }>(
        '/api/upload/avatar',
        formData
      );
      setAvatarPreview(result.data.url);
      setPendingAvatar(undefined);
      await refreshUser();
      setSaveMessage('Photo saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setAvatarPreview(profile?.avatar || null);
      setAvatarError(
        err instanceof Error ? err.message : 'Failed to upload photo. Please try again.'
      );
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await api.delete('/api/upload/avatar');
      setAvatarPreview(null);
      setPendingAvatar(undefined);
      setAvatarError(null);
      await refreshUser();
      setSaveMessage('Photo removed.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setAvatarError('Failed to remove photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title || undefined,
        department: formData.department || undefined,
      });
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
          {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
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
            <p className="text-xs text-gray-500 mb-3">JPG, PNG, WebP or GIF. Max size 5MB.</p>
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
            {avatarUploading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
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
  const { data: apiPrefs } = useNotificationPreferences();
  const updatePrefs = useUpdatePreferences();
  const [settings, setSettings] = useState(defaultNotifications);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load API preferences into local state
  useEffect(() => {
    if (apiPrefs?.preferences) {
      const p = apiPrefs.preferences as Record<string, boolean>;
      setSettings({
        email: {
          programUpdates: p['email_programUpdates'] ?? defaultNotifications.email.programUpdates,
          assessmentReminders:
            p['email_assessmentReminders'] ?? defaultNotifications.email.assessmentReminders,
          goalDeadlines: p['email_goalDeadlines'] ?? defaultNotifications.email.goalDeadlines,
          mentoringReminders:
            p['email_mentoringReminders'] ?? defaultNotifications.email.mentoringReminders,
          weeklyDigest: p['email_weeklyDigest'] ?? defaultNotifications.email.weeklyDigest,
          marketingEmails: p['email_marketingEmails'] ?? defaultNotifications.email.marketingEmails,
        },
        push: {
          programUpdates: p['push_programUpdates'] ?? defaultNotifications.push.programUpdates,
          assessmentReminders:
            p['push_assessmentReminders'] ?? defaultNotifications.push.assessmentReminders,
          goalDeadlines: p['push_goalDeadlines'] ?? defaultNotifications.push.goalDeadlines,
          mentoringReminders:
            p['push_mentoringReminders'] ?? defaultNotifications.push.mentoringReminders,
          directMessages: p['push_directMessages'] ?? defaultNotifications.push.directMessages,
        },
        inApp: {
          showBadges: p['inApp_showBadges'] ?? defaultNotifications.inApp.showBadges,
          soundEnabled: p['inApp_soundEnabled'] ?? defaultNotifications.inApp.soundEnabled,
          desktopNotifications:
            p['inApp_desktopNotifications'] ?? defaultNotifications.inApp.desktopNotifications,
        },
      });
    }
  }, [apiPrefs]);

  const handleToggle = (category: 'email' | 'push' | 'inApp', key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, boolean>),
        [key]: value,
      },
    }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    // Flatten settings into preferences Record
    const preferences: Record<string, boolean> = {};
    Object.entries(settings.email).forEach(([k, v]) => {
      preferences[`email_${k}`] = v as boolean;
    });
    Object.entries(settings.push).forEach(([k, v]) => {
      preferences[`push_${k}`] = v as boolean;
    });
    Object.entries(settings.inApp).forEach(([k, v]) => {
      preferences[`inApp_${k}`] = v as boolean;
    });

    await updatePrefs.mutateAsync({ preferences });
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
          {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
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
          {(
            [
              {
                key: 'programUpdates',
                label: 'Program Updates',
                desc: 'New modules, deadlines, and program announcements',
              },
              {
                key: 'assessmentReminders',
                label: 'Assessment Reminders',
                desc: 'Pending assessments and feedback requests',
              },
              {
                key: 'goalDeadlines',
                label: 'Goal Deadlines',
                desc: 'Upcoming goal due dates and review reminders',
              },
              {
                key: 'mentoringReminders',
                label: 'Mentoring Reminders',
                desc: 'Upcoming sessions and prep reminders',
              },
              {
                key: 'weeklyDigest',
                label: 'Weekly Digest',
                desc: 'Summary of your weekly activity and progress',
              },
              {
                key: 'marketingEmails',
                label: 'Marketing Emails',
                desc: 'Product updates, tips, and promotional content',
              },
            ] as const
          ).map((item, index, arr) => (
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
          {(
            [
              {
                key: 'programUpdates',
                label: 'Program Updates',
                desc: 'New content and program changes',
              },
              {
                key: 'assessmentReminders',
                label: 'Assessment Reminders',
                desc: 'Time-sensitive assessment notifications',
              },
              {
                key: 'goalDeadlines',
                label: 'Goal Deadlines',
                desc: 'Urgent deadline notifications',
              },
              {
                key: 'mentoringReminders',
                label: 'Mentoring Reminders',
                desc: 'Session start reminders',
              },
              {
                key: 'directMessages',
                label: 'Direct Messages',
                desc: 'Messages from coaches and team members',
              },
            ] as const
          ).map((item, index, arr) => (
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
          {(
            [
              {
                key: 'showBadges',
                label: 'Show Badge Counts',
                desc: 'Display unread notification counts',
              },
              {
                key: 'soundEnabled',
                label: 'Sound Effects',
                desc: 'Play sounds for new notifications',
              },
              {
                key: 'desktopNotifications',
                label: 'Desktop Notifications',
                desc: 'Show browser notifications when the app is in background',
              },
            ] as const
          ).map((item, index, arr) => (
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

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown Device', browser: 'Unknown Browser' };
  const isPhone = /iPhone|Android/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isPhone ? 'Mobile Device' : isTablet ? 'Tablet' : 'Desktop';
  let browser = 'Unknown Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  return { device, browser };
}

function SecurityTab() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const { data: activeSessions, isLoading: sessionsLoading } = useActiveSessions();
  const revokeSession = useRevokeSession();
  const changePassword = useChangePassword();

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordMessage('Password must be at least 12 characters.');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPasswordMessage('Password changed successfully! Other sessions have been signed out.');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      setPasswordMessage(msg);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
    } catch {
      // silently fail — session list will still refresh
    }
  };

  const getDeviceIcon = (ua: string | null) => {
    if (ua && /iPhone|Android/i.test(ua)) {
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
                Keep your account secure with a strong password
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
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              passwordMessage.includes('successfully')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {passwordMessage}
          </div>
        )}

        {showPasswordForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Current Password
              </label>
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm New Password
              </label>
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
            <li>Minimum 12 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </div>
      </div>

      {/* Two-Factor Authentication — coming soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Enable 2FA
          </button>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Enhance your security</h4>
            <p className="text-xs text-yellow-700 mt-1">
              Two-factor authentication is coming soon. Stay tuned for this security upgrade.
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-500">Devices currently logged into your account</p>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(activeSessions ?? []).map((session) => {
              const { device, browser } = parseUserAgent(session.userAgent);
              return (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg ${
                    session.isCurrent ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${session.isCurrent ? 'bg-green-100' : 'bg-gray-50'}`}
                      >
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{device}</span>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{browser}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                          {session.ipAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.ipAddress}
                            </span>
                          )}
                          {session.lastActiveAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeSince(session.lastActiveAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeSession.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {(activeSessions ?? []).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No active sessions found.</p>
            )}
          </div>
        )}
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

const categoryDescriptions: Record<string, string> = {
  communication: 'Slack, Microsoft Teams, and messaging tools',
  calendar: 'Google Calendar, Outlook, and scheduling apps',
  storage: 'Google Drive, Dropbox, and file storage',
  hr: 'Workday, BambooHR, and people management',
  analytics: 'Tableau, Power BI, and reporting tools',
};

function IntegrationsTab() {
  const categories = Object.entries(categoryLabels).map(([id, label]) => ({ id, label }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">
          Connect third-party services to enhance your workflow
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Puzzle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Integrations Coming Soon</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          We&apos;re building native integrations with popular tools. Connect your communication
          apps, calendar, file storage, and HR systems — all from this page.
        </p>
      </div>

      {/* Planned Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
          >
            <div className="p-2 bg-gray-50 rounded-lg shrink-0 text-gray-500">
              {categoryIcons[cat.id]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{cat.label}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-500">{categoryDescriptions[cat.id]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Request */}
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-5">
        <div className="text-center py-4">
          <h3 className="font-medium text-gray-900 mb-2">Need a specific integration?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Let us know which tools you use and we&apos;ll prioritize accordingly.
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
    setExportMessage(
      'Your data export has been queued. You will receive an email when it is ready.'
    );
    setTimeout(() => setExportMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500">Manage your organization settings and billing</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Organization Name
            </label>
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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">Billing &amp; Subscription</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Subscription management, usage tracking, and invoices will be available here. Contact your
          administrator for billing enquiries.
        </p>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <p className="text-sm text-gray-500 mb-4">
          Download a copy of all your data. The export will include your profile, goals, program
          progress, assessment results, and mentoring history.
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
                Permanently delete your account and all associated data. This action cannot be
                undone.
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
                    This will permanently delete your account, all organizations, programs, goals,
                    and data. Type <strong>delete my account</strong> to confirm.
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
