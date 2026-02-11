'use client';

const TENANT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
  churned: 'bg-gray-100 text-gray-500',
};

const USER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-800',
};

export function TenantStatusBadge({ status }: { status: string }) {
  const colors = TENANT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {status}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: string }) {
  const colors = USER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {status}
    </span>
  );
}
