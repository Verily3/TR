'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, LogOut, Settings, UserRoundCog, ChevronDown } from 'lucide-react';
import { ImpersonationSearchModal } from './ImpersonationSearchModal';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = memo(function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/login');
  }, [logout, router]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const initials = `${(user?.firstName?.[0] || '').toUpperCase()}${(user?.lastName?.[0] || '').toUpperCase()}`;

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              TR
            </div>
            <span className="text-sm font-medium text-gray-900">Results Tracking</span>
          </div>
        </div>

        {/* Impersonation inline indicator */}
        {user?.isImpersonating && (
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Viewing as: {user.email}
            </div>
          </div>
        )}

        {/* User dropdown */}
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {user?.avatar ? (
              <Image src={user.avatar} alt="" width={32} height={32} className="rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
            )}
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-500 capitalize text-xs">{user?.roleSlug?.replace(/_/g, ' ')}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </button>

              {user?.agencyId && (
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowImpersonateModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserRoundCog className="w-4 h-4 text-gray-400" />
                  Login As User
                </button>
              )}

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <ImpersonationSearchModal
        open={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
      />
    </>
  );
});
