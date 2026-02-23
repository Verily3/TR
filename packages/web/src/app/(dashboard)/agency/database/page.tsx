'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Database,
  Lock,
  Unlock,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Copy,
  Shield,
  Server,
  Table2,
  GitBranch,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useVerifySecret,
  useDbHealth,
  useRunMigrations,
  type DbHealthData,
  type MigrationResult,
} from '@/hooks/api/useAdminDb';

// ============ Types ============

type LogLevel = 'info' | 'success' | 'error' | 'warning' | 'output';
type RunStatus = 'idle' | 'running' | 'success' | 'failed';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// ============ Helpers ============

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function logColor(level: LogLevel): string {
  switch (level) {
    case 'info':
      return 'text-blue-400';
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'output':
      return 'text-slate-400';
  }
}

// ============ Sub-Components ============

function StatusBadge({ status }: { status: RunStatus }) {
  const configs = {
    idle: { icon: Clock, label: 'Idle', bg: 'bg-slate-100 text-slate-600' },
    running: { icon: RefreshCw, label: 'Running', bg: 'bg-blue-100 text-blue-700' },
    success: { icon: CheckCircle2, label: 'Success', bg: 'bg-green-100 text-green-700' },
    failed: { icon: XCircle, label: 'Failed', bg: 'bg-red-100 text-red-700' },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg}`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

function TerminalOutput({
  logs,
  status,
  title = 'Terminal Output',
}: {
  logs: LogEntry[];
  status: RunStatus;
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = useCallback(() => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  }, [logs]);

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy log"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Log area */}
      <div
        ref={scrollRef}
        className="bg-[#1e293b] p-4 max-h-[400px] overflow-y-auto font-mono text-sm leading-relaxed"
      >
        {logs.length === 0 ? (
          <p className="text-slate-500 italic">No output yet. Run an action to see results.</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-500 select-none shrink-0">[{entry.timestamp}]</span>
              <span className={logColor(entry.level)}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SecretGate({ onUnlock }: { onUnlock: (secret: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const verify = useVerifySecret();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!input.trim()) {
      setError('Please enter the admin secret');
      return;
    }
    try {
      const valid = await verify.mutateAsync(input.trim());
      if (valid) {
        sessionStorage.setItem('admin_db_secret', input.trim());
        onUnlock(input.trim());
      } else {
        setError('Invalid secret. Check your ADMIN_SECRET env var.');
      }
    } catch {
      setError('Failed to verify secret. Is the API running?');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter your admin secret to access database management tools. This is your{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">ADMIN_SECRET</code>{' '}
          environment variable.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter admin secret..."
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 text-left">{error}</p>}
          <button
            type="submit"
            disabled={verify.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {verify.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            {verify.isPending ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DatabaseHealthCard({
  health,
  isLoading,
  onRefresh,
}: {
  health: DbHealthData | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [showTables, setShowTables] = useState(false);
  const [showMigrations, setShowMigrations] = useState(false);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Database Health</h3>
            <p className="text-indigo-100 text-sm">Connection, tables, and migration status</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {isLoading && !health ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading health data...</span>
          </div>
        ) : health ? (
          <>
            {/* Connection Status */}
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Connection
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${health.connection.connected ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm font-medium">
                      {health.connection.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Latency</p>
                  <p className="text-sm font-medium">{health.connection.latencyMs}ms</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">PostgreSQL</p>
                  <p className="text-sm font-medium">v{health.connection.postgresVersion}</p>
                </div>
              </div>
            </div>

            {/* Tables */}
            <div>
              <button
                onClick={() => setShowTables(!showTables)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Table2 className="w-4 h-4" /> Tables ({health.tables.length})
                </span>
                {showTables ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showTables && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {health.tables.map((t) => (
                    <div
                      key={`${t.schema}.${t.name}`}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-sm"
                    >
                      <span className="font-mono text-slate-700 truncate">{t.name}</span>
                      <span className="text-slate-400 text-xs ml-2 shrink-0">
                        ~{t.estimatedRows.toLocaleString()} rows
                      </span>
                    </div>
                  ))}
                  {health.tables.length === 0 && (
                    <p className="text-sm text-slate-400 italic col-span-full">No tables found</p>
                  )}
                </div>
              )}
            </div>

            {/* Migration Summary */}
            <div>
              <button
                onClick={() => setShowMigrations(!showMigrations)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" /> Migrations
                </span>
                {showMigrations ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-700">{health.migrations.available}</p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{health.migrations.applied}</p>
                  <p className="text-xs text-green-600">Applied</p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${health.migrations.pending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}
                >
                  <p
                    className={`text-2xl font-bold ${health.migrations.pending > 0 ? 'text-amber-700' : 'text-slate-700'}`}
                  >
                    {health.migrations.pending}
                  </p>
                  <p
                    className={`text-xs ${health.migrations.pending > 0 ? 'text-amber-600' : 'text-slate-500'}`}
                  >
                    Pending
                  </p>
                </div>
              </div>
              {showMigrations && (
                <div className="space-y-2">
                  {health.migrations.availableFiles.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded text-xs font-mono"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-slate-600 truncate">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {health.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-700">{health.error}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No health data available</p>
        )}
      </div>
    </div>
  );
}

function MigrationCard({
  secret,
  health,
  onHealthRefresh,
}: {
  secret: string;
  health: DbHealthData | undefined;
  onHealthRefresh: () => void;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const runMigrations = useRunMigrations();

  const addLog = useCallback((level: LogLevel, message: string) => {
    setLogs((prev) => [...prev, { timestamp: now(), level, message }]);
  }, []);

  const handleCheckStatus = useCallback(() => {
    setStatus('running');
    addLog('info', 'Checking migration status...');

    if (health) {
      addLog('output', `Database: ${health.connection.databaseUrl}`);
      addLog('output', `PostgreSQL: v${health.connection.postgresVersion}`);
      addLog('output', `Connection latency: ${health.connection.latencyMs}ms`);
      addLog('output', `Tables: ${health.tables.length}`);
      addLog('output', `Applied migrations: ${health.migrations.applied}`);
      addLog('output', `Available migration files: ${health.migrations.available}`);
      if (health.migrations.pending > 0) {
        addLog('warning', `Pending migrations: ${health.migrations.pending}`);
      } else {
        addLog('success', 'Database is up to date. No pending migrations.');
      }
      setStatus('success');
    } else {
      addLog('warning', 'Health data not loaded. Refreshing...');
      onHealthRefresh();
      setStatus('idle');
    }
  }, [health, addLog, onHealthRefresh]);

  const handleRunMigrations = useCallback(async () => {
    setShowConfirm(false);
    setStatus('running');
    setLogs([]);
    addLog('info', 'Starting database migration...');
    addLog('info', `Using secret: ${'*'.repeat(8)}...`);

    try {
      const result: MigrationResult = await runMigrations.mutateAsync(secret);

      // Log all execution logs from the server
      result.logs.forEach((log) => {
        addLog('output', log);
      });

      if (result.success) {
        addLog('success', `Migration completed in ${result.durationMs}ms`);
        if (result.newlyApplied.length > 0) {
          addLog('success', `Applied ${result.newlyApplied.length} new migration(s):`);
          result.newlyApplied.forEach((m) => addLog('success', `  + ${m}`));
        } else {
          addLog('success', 'Database was already up to date.');
        }
        setStatus('success');
      } else {
        addLog('error', `Migration failed: ${result.error}`);
        if (result.errorStack) {
          result.errorStack
            .split('\n')
            .slice(0, 5)
            .forEach((line) => {
              addLog('error', `  ${line}`);
            });
        }
        setStatus('failed');
      }

      // Refresh health data
      onHealthRefresh();
    } catch (err: any) {
      addLog('error', `Request failed: ${err.message}`);
      setStatus('failed');
    }
  }, [secret, addLog, runMigrations, onHealthRefresh]);

  const applied = health?.migrations.applied ?? 0;
  const available = health?.migrations.available ?? 0;
  const pending = health?.migrations.pending ?? 0;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">SQL Migrations</h3>
            <p className="text-amber-100 text-sm">Drizzle ORM migration management</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-700">{available}</p>
            <p className="text-xs text-slate-500">Total Files</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{applied}</p>
            <p className="text-xs text-green-600">Applied</p>
          </div>
          <div
            className={`p-3 rounded-lg text-center ${pending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}
          >
            <p
              className={`text-2xl font-bold ${pending > 0 ? 'text-amber-700' : 'text-slate-700'}`}
            >
              {pending}
            </p>
            <p className={`text-xs ${pending > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              Pending
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCheckStatus}
            disabled={status === 'running'}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'running' ? 'animate-spin' : ''}`} />
            Check Status
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={status === 'running'}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run Migrations
          </button>
        </div>

        {/* Confirmation dialog */}
        {showConfirm && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800">Confirm Migration</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This will run all pending Drizzle migrations against the production database. Make
                  sure you have a backup before proceeding.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleRunMigrations}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Yes, Run Migrations
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium border transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terminal Output */}
        <TerminalOutput logs={logs} status={status} title="Migration Output" />
      </div>
    </div>
  );
}

function HelpSection() {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-700">How It Works</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-semibold text-indigo-600 mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Database Health
            </h4>
            <p className="text-sm text-slate-600">
              Checks connection status, PostgreSQL version, lists all tables with estimated row
              counts, and shows the migration state (applied vs. available files).
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" /> SQL Migrations
            </h4>
            <p className="text-sm text-slate-600">
              Runs pending Drizzle ORM migrations against the database. Shows detailed execution
              logs including what was applied, timing, and any errors.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Important</h4>
            <ul className="text-sm text-amber-700 mt-1 space-y-1 list-disc list-inside">
              <li>Always back up your database before running migrations in production.</li>
              <li>Migrations are forward-only and cannot be rolled back from this UI.</li>
              <li>
                The admin secret is stored in your browser&apos;s session storage and clears when
                you close the tab.
              </li>
              <li>
                Auto-migration on deploy can be enabled by setting{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-xs">AUTO_MIGRATE=true</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Main Page ============

export default function DatabasePage() {
  const { user } = useAuth();
  const [secret, setSecret] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_db_secret');
    }
    return null;
  });

  const healthQuery = useDbHealth(secret);

  if (!user?.agencyId) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="p-8 text-center text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Agency access required. Please log in with an agency account.</p>
        </div>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Database Management</h1>
            <p className="text-sm text-gray-500">Manage migrations and monitor database health</p>
          </div>
        </div>
        <SecretGate onUnlock={setSecret} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Database Management</h1>
            <p className="text-sm text-gray-500">Manage migrations and monitor database health</p>
          </div>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_db_secret');
            setSecret(null);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Lock className="w-4 h-4" />
          Lock
        </button>
      </div>

      <div className="space-y-6">
        <DatabaseHealthCard
          health={healthQuery.data}
          isLoading={healthQuery.isLoading}
          onRefresh={() => healthQuery.refetch()}
        />

        <MigrationCard
          secret={secret}
          health={healthQuery.data}
          onHealthRefresh={() => healthQuery.refetch()}
        />

        <HelpSection />
      </div>
    </div>
  );
}
