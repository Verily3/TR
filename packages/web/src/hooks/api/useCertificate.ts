import { useState } from 'react';
import { API_URL } from '@/lib/api';

/**
 * Download a completion certificate for a given enrollment.
 * Triggers a browser file download.
 */
export function useDownloadCertificate() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (
    tenantId: string,
    programId: string,
    enrollmentId: string,
    programName: string
  ) => {
    setIsDownloading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const impersonationToken =
        typeof window !== 'undefined' ? sessionStorage.getItem('impersonation_token') : null;

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (impersonationToken) headers['X-Impersonation-Token'] = impersonationToken;

      const response = await fetch(
        `${API_URL}/api/tenants/${tenantId}/programs/${programId}/enrollments/${enrollmentId}/certificate`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${programName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading, error };
}
