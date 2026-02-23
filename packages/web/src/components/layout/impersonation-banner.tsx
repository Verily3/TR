'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ImpersonationStatus {
  isImpersonating: boolean;
  session?: {
    id: string;
    expiresAt: string;
    reason: string | null;
  };
  adminUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  targetUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    checkImpersonationStatus();
  }, []);

  async function checkImpersonationStatus() {
    const token = sessionStorage.getItem('impersonation_token');
    if (!token) {
      setStatus({ isImpersonating: false });
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/impersonate/status`, {
        headers: {
          'X-Impersonation-Token': token,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          setStatus(json.data);
        } else {
          setStatus({ isImpersonating: false });
          sessionStorage.removeItem('impersonation_token');
        }
      } else {
        setStatus({ isImpersonating: false });
        sessionStorage.removeItem('impersonation_token');
      }
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
      setStatus({ isImpersonating: false });
      sessionStorage.removeItem('impersonation_token');
    }
  }

  async function handleEndImpersonation() {
    const token = sessionStorage.getItem('impersonation_token');
    if (!token) return;

    setIsEnding(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/api/admin/impersonate/end`, {
        method: 'POST',
        headers: {
          'X-Impersonation-Token': token,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      sessionStorage.removeItem('impersonation_token');
      setStatus({ isImpersonating: false });

      // Reload to refresh with admin context
      window.location.reload();
    } catch (error) {
      console.error('Failed to end impersonation:', error);
    } finally {
      setIsEnding(false);
    }
  }

  if (!status?.isImpersonating) {
    return null;
  }

  const targetName = status.targetUser
    ? `${status.targetUser.firstName || ''} ${status.targetUser.lastName || ''}`.trim() ||
      status.targetUser.email
    : 'Unknown User';

  const adminName = status.adminUser
    ? `${status.adminUser.firstName || ''} ${status.adminUser.lastName || ''}`.trim() ||
      status.adminUser.email
    : 'Admin';

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm font-medium">
          Viewing as <strong>{targetName}</strong>
        </span>
        {status.session?.reason && (
          <span className="text-sm opacity-75">({status.session.reason})</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs opacity-75">Logged in as {adminName}</span>
        <button
          onClick={handleEndImpersonation}
          disabled={isEnding}
          className="px-3 py-1 text-sm font-medium bg-amber-600 border border-amber-700 text-white rounded hover:bg-amber-700 disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'Switch Back'}
        </button>
      </div>
    </div>
  );
}
