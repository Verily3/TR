'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getNavigationForRole } from '@tr/shared';
import {
  Home,
  BarChart3,
  Target,
  BookOpen,
  Wrench,
  Users,
  ClipboardList,
  UserCircle,
  PieChart,
  Settings,
  Building2,
  Bell,
  HelpCircle,
  X,
} from 'lucide-react';

const NAV_ITEMS: Record<string, { label: string; href: string; icon: React.ComponentType<{ className?: string }> }> = {
  dashboard: { label: 'Dashboard', href: '/dashboard', icon: Home },
  scorecard: { label: 'Scorecard', href: '/scorecard', icon: BarChart3 },
  planning: { label: 'Planning & Goals', href: '/planning', icon: Target },
  programs: { label: 'Programs', href: '/programs', icon: BookOpen },
  'program-builder': { label: 'Program Builder', href: '/program-builder', icon: Wrench },
  mentoring: { label: 'Mentoring', href: '/mentoring', icon: Users },
  assessments: { label: 'Assessments', href: '/assessments', icon: ClipboardList },
  people: { label: 'People', href: '/people', icon: UserCircle },
  analytics: { label: 'Analytics', href: '/analytics', icon: PieChart },
  notifications: { label: 'Notifications', href: '/notifications', icon: Bell },
  help: { label: 'Help & Support', href: '/help', icon: HelpCircle },
  settings: { label: 'Settings', href: '/settings', icon: Settings },
  agency: { label: 'Agency Portal', href: '/agency', icon: Building2 },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleNavItems = user?.roleSlug
    ? getNavigationForRole(user.roleSlug)
    : ['dashboard'];

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 lg:w-64 h-screen bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                TR
              </div>
              <div>
                <div className="text-sm font-medium tracking-wide text-gray-900">Results Tracking</div>
                <div className="text-xs text-gray-500">System</div>
              </div>
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const navItem = NAV_ITEMS[item];
              if (!navItem) return null;

              const Icon = navItem.icon;
              const isActive = pathname === navItem.href || pathname.startsWith(`${navItem.href}/`);

              return (
                <li key={item}>
                  <Link
                    href={navItem.href}
                    onClick={onClose}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{navItem.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.avatar ? (
              <Image src={user.avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 capitalize truncate">
                {user?.roleSlug?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
