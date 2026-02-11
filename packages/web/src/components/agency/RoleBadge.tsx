'use client';

const ROLE_COLORS: Record<string, string> = {
  agency_owner: 'bg-purple-100 text-purple-800',
  agency_admin: 'bg-blue-100 text-blue-800',
  tenant_admin: 'bg-indigo-100 text-indigo-800',
  facilitator: 'bg-teal-100 text-teal-800',
  mentor: 'bg-amber-100 text-amber-800',
  learner: 'bg-green-100 text-green-800',
};

const ROLE_LABELS: Record<string, string> = {
  agency_owner: 'Agency Owner',
  agency_admin: 'Agency Admin',
  tenant_admin: 'Client Admin',
  facilitator: 'Facilitator',
  mentor: 'Mentor',
  learner: 'Learner',
};

export function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role) return null;
  const colors = ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';
  const label = ROLE_LABELS[role] || role;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}
