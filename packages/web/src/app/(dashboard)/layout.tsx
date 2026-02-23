'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useOnboardingPath } from '@/hooks/api/useOnboarding';

/**
 * Redirects new (non-agency) users to /onboarding if they haven't started yet.
 * Only fires once per session — React Query caches the result.
 */
function OnboardingGate({ userId, isAgencyUser }: { userId: string; isAgencyUser: boolean }) {
  const router = useRouter();
  const { data: pathData } = useOnboardingPath();

  useEffect(() => {
    if (isAgencyUser) return;
    if (!pathData) return;
    if (pathData.status === 'not_started') {
      router.push('/onboarding');
    }
  }, [pathData, isAgencyUser, router, userId]);

  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Cmd+K / Ctrl+K global shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen((v) => !v);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAgencyUser = !!(user.agencyId && !user.tenantId);
  const tenantId = isAgencyUser ? null : (user.tenantId ?? null);

  return (
    <div className="min-h-screen bg-white">
      <OnboardingGate userId={user.id} isAgencyUser={isAgencyUser} />
      <ImpersonationBanner />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <CommandPalette
        tenantId={tenantId}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
