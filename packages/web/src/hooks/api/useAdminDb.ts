import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ============ Types ============

export interface DbHealthData {
  status: 'ok' | 'error';
  timestamp: string;
  durationMs: number;
  connection: {
    connected: boolean;
    latencyMs: number;
    postgresVersion: string;
    databaseUrl: string;
  };
  tables: { schema: string; name: string; estimatedRows: number }[];
  migrations: {
    applied: number;
    available: number;
    pending: number;
    appliedList: { hash: string; createdAt: string }[];
    availableFiles: string[];
  };
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  databaseUrl: string;
  migrationsFolder: string;
  appliedBefore: string[];
  appliedAfter: string[];
  newlyApplied: string[];
  availableMigrations: string[];
  pending: string[];
  logs: string[];
  error?: string;
  errorStack?: string;
}

// ============ Helpers ============

function adminHeaders(secret: string): Record<string, string> {
  return {
    'X-Admin-Secret': secret,
    'Accept': 'application/json',
  };
}

// ============ Queries ============

export function useVerifySecret() {
  return useMutation({
    mutationFn: async (secret: string) => {
      const response = await api.post<{ valid: boolean }>(
        '/api/admin/db/verify',
        { secret },
        adminHeaders(secret)
      );
      return response.data.valid;
    },
  });
}

export function useDbHealth(secret: string | null) {
  return useQuery({
    queryKey: ['adminDbHealth', secret],
    queryFn: async () => {
      const response = await api.get<DbHealthData>(
        `/api/admin/db/health?secret=${encodeURIComponent(secret!)}`,
        adminHeaders(secret!)
      );
      return response.data;
    },
    enabled: !!secret,
    refetchInterval: false,
    staleTime: 30_000,
  });
}

export function useRunMigrations() {
  return useMutation({
    mutationFn: async (secret: string) => {
      const response = await api.get<MigrationResult>(
        `/api/admin/db/migrate?secret=${encodeURIComponent(secret)}`,
        adminHeaders(secret)
      );
      return response.data;
    },
  });
}
