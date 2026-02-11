'use client';

import { useState, useCallback } from 'react';
import { X, Upload, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useTenants } from '@/hooks/api/useTenants';
import { useBulkEnrollAgency } from '@/hooks/api/useAgencyEnrollments';
import type { EnrollmentRole } from '@/types/programs';

interface BulkInviteModalProps {
  open: boolean;
  onClose: () => void;
  programId: string;
  onSuccess?: () => void;
}

interface ParsedRow {
  firstName: string;
  lastName: string;
  email: string;
  clientName: string;
  role: EnrollmentRole;
  tenantId?: string;
  tenantMatch: string | null;
  valid: boolean;
  errors: string[];
}

type Step = 'input' | 'preview' | 'results';

const VALID_ROLES: EnrollmentRole[] = ['learner', 'mentor', 'facilitator'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRole(raw: string): EnrollmentRole {
  const normalized = raw.trim().toLowerCase();
  if (VALID_ROLES.includes(normalized as EnrollmentRole)) {
    return normalized as EnrollmentRole;
  }
  return 'learner';
}

export function BulkInviteModal({ open, onClose, programId, onSuccess }: BulkInviteModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResults, setImportResults] = useState<{
    enrolled: number;
    created: number;
    errors: number;
    errorDetails: { email: string; error: string }[];
  } | null>(null);

  const { data: tenants } = useTenants();
  const bulkEnroll = useBulkEnrollAgency(programId);

  const resetState = useCallback(() => {
    setStep('input');
    setCsvText('');
    setParsedRows([]);
    setImportResults(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const matchTenant = useCallback(
    (clientName: string): { id: string; name: string } | null => {
      if (!clientName || !tenants) return null;
      const normalized = clientName.trim().toLowerCase();
      if (!normalized) return null;

      // Try exact match first (case-insensitive)
      const exact = tenants.find(
        (t) => t.name.toLowerCase() === normalized
      );
      if (exact) return { id: exact.id, name: exact.name };

      // Try partial match (case-insensitive)
      const partial = tenants.find(
        (t) =>
          t.name.toLowerCase().includes(normalized) ||
          normalized.includes(t.name.toLowerCase())
      );
      if (partial) return { id: partial.id, name: partial.name };

      return null;
    },
    [tenants]
  );

  const handleParse = useCallback(() => {
    const lines = csvText.split('\n').filter((line) => line.trim().length > 0);
    const rows: ParsedRow[] = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      const [firstName = '', lastName = '', email = '', clientName = '', roleRaw = ''] = parts;
      const errors: string[] = [];

      if (!firstName) errors.push('Missing first name');
      if (!lastName) errors.push('Missing last name');
      if (!email) {
        errors.push('Missing email');
      } else if (!EMAIL_REGEX.test(email)) {
        errors.push('Invalid email format');
      }

      const role = parseRole(roleRaw);
      const tenantResult = matchTenant(clientName);

      rows.push({
        firstName,
        lastName,
        email,
        clientName,
        role,
        tenantId: tenantResult?.id,
        tenantMatch: tenantResult?.name || null,
        valid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
    setStep('preview');
  }, [csvText, matchTenant]);

  const validRows = parsedRows.filter((r) => r.valid);
  const invalidRows = parsedRows.filter((r) => !r.valid);

  const handleImport = useCallback(async () => {
    const participants = validRows.map((row) => ({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      tenantId: row.tenantId,
    }));

    try {
      const result = await bulkEnroll.mutateAsync(participants);
      setImportResults({
        enrolled: result.summary.enrolled,
        created: result.summary.created,
        errors: result.summary.errors,
        errorDetails: result.results
          .filter((r) => !r.success)
          .map((r) => ({ email: r.email, error: r.error || 'Unknown error' })),
      });
      setStep('results');
      onSuccess?.();
    } catch {
      // Mutation error is handled by bulkEnroll.error state
    }
  }, [validRows, bulkEnroll, onSuccess]);

  if (!open) return null;

  const stepNumber = step === 'input' ? 1 : step === 'preview' ? 2 : 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Participants</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Bulk add participants via CSV data
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-3 py-3 border-b border-gray-100">
          {[
            { num: 1, label: 'Input' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'Results' },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  num === stepNumber
                    ? 'bg-accent text-accent-foreground'
                    : num < stepNumber
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {num < stepNumber ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  num === stepNumber ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {num < 3 && (
                <div className="w-8 h-px bg-gray-200 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Paste CSV Data
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="First Name, Last Name, Email, Client, Role"
                  className="w-full min-h-[200px] font-mono text-sm rounded-lg border border-gray-300 px-3 py-2.5 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y placeholder:text-gray-400"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Expected Format
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Each line should contain: <span className="font-mono text-gray-700">First Name, Last Name, Email, Client, Role</span>
                </p>
                <div className="font-mono text-xs text-gray-600 bg-white rounded border border-gray-200 p-3 space-y-0.5">
                  <p>John, Smith, john.smith@acme.com, Acme Corp, learner</p>
                  <p>Sarah, Johnson, sarah.j@techco.com, TechCo, mentor</p>
                  <p>Mike, Davis, mike.d@startup.io, , learner</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Client and Role are optional. Role defaults to "learner" if omitted. Valid roles: learner, mentor, facilitator.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    <XCircle className="w-3.5 h-3.5" />
                    {invalidRows.length} invalid
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {parsedRows.length} total rows parsed
                </span>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            row.valid
                              ? 'hover:bg-gray-50'
                              : 'bg-red-50/50 hover:bg-red-50'
                          }
                        >
                          <td className="px-4 py-2.5">
                            {row.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-xs text-red-600 truncate max-w-[120px]" title={row.errors.join(', ')}>
                                  {row.errors[0]}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-900">
                            {row.firstName || (
                              <span className="text-gray-300 italic">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-900">
                            {row.lastName || (
                              <span className="text-gray-300 italic">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-900 font-mono text-xs">
                            {row.email || (
                              <span className="text-gray-300 italic">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {row.tenantMatch ? (
                              <span className="text-gray-900">{row.tenantMatch}</span>
                            ) : row.clientName ? (
                              <span className="text-amber-600 text-xs" title={`No match for "${row.clientName}"`}>
                                Unaffiliated
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Unaffiliated</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                row.role === 'facilitator'
                                  ? 'bg-purple-50 text-purple-700'
                                  : row.role === 'mentor'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {row.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && importResults && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <h3 className="text-center text-lg font-semibold text-gray-900">
                Import Complete
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{importResults.enrolled}</p>
                  <p className="text-xs text-green-600 mt-1">Enrolled</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{importResults.created}</p>
                  <p className="text-xs text-blue-600 mt-1">New Users Created</p>
                </div>
                <div className={`rounded-lg p-4 text-center border ${importResults.errors > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${importResults.errors > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {importResults.errors}
                  </p>
                  <p className={`text-xs mt-1 ${importResults.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    Errors
                  </p>
                </div>
              </div>

              {importResults.errorDetails.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
                  <ul className="space-y-1.5">
                    {importResults.errorDetails.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-red-700">
                          <span className="font-mono font-medium">{err.email}</span>
                          {' — '}
                          {err.error}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {step === 'input' && (
            <>
              <div />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={!csvText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Parse
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('input')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || bulkEnroll.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkEnroll.isPending ? (
                  'Importing...'
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {validRows.length} Participant{validRows.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          )}

          {step === 'results' && (
            <>
              <div />
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>

        {/* Mutation error display */}
        {bulkEnroll.error && step === 'preview' && (
          <div className="px-6 pb-4 -mt-2">
            <p className="text-sm text-red-600">
              Import failed: {(bulkEnroll.error as Error).message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkInviteModal;
