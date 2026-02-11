'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useTenant, useTenantStats, useUpdateTenant } from '@/hooks/api/useTenants';
import { useUsers } from '@/hooks/api/useUsers';
import { RoleBadge } from '@/components/agency/RoleBadge';
import { TenantStatusBadge, UserStatusBadge } from '@/components/agency/StatusBadge';
import { CreateUserModal } from '@/components/agency/CreateUserModal';
import { ChangeRoleModal } from '@/components/agency/ChangeRoleModal';
import { ImpersonateUserModal } from '@/components/agency/ImpersonateUserModal';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = params.tenantId as string;

  const { data: tenant, isLoading: loadingTenant } = useTenant(tenantId);
  const { data: stats } = useTenantStats(tenantId);
  const { data: usersResponse, isLoading: loadingUsers } = useUsers(tenantId, { limit: 100 });
  const updateTenant = useUpdateTenant(tenantId);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [changeRoleUser, setChangeRoleUser] = useState<{
    userId: string;
    userName: string;
    currentRole: string | null;
  } | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [impersonateUser, setImpersonateUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  if (!user?.agencyId) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="p-8 text-center text-gray-500">Agency access required.</div>
      </div>
    );
  }

  if (loadingTenant) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="text-gray-500">Loading client details...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="p-8 text-center text-gray-500">Client not found.</div>
      </div>
    );
  }

  const users_list = usersResponse?.data || [];
  const filtered = users_list.filter((u) => {
    if (roleFilter !== 'all' && u.roleSlug !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.firstName.toLowerCase().includes(q) &&
        !u.lastName.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTenant.mutateAsync({ status: newStatus as 'active' | 'trial' | 'suspended' | 'churned' });
      setEditingStatus(false);
    } catch (err) {
      // handled by mutation
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/agency" className="hover:text-red-600">Agency</Link>
        <span>/</span>
        <Link href="/agency" className="hover:text-red-600">Clients</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant.name}</span>
      </div>

      {/* Client Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{tenant.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {tenant.industry && <span>{tenant.industry}</span>}
              <span>Slug: {tenant.slug}</span>
              {tenant.domain && <span>{tenant.domain}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {editingStatus ? (
              <select
                value={tenant.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                onBlur={() => setEditingStatus(false)}
                autoFocus
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="churned">Churned</option>
              </select>
            ) : (
              <button onClick={() => setEditingStatus(true)} className="cursor-pointer">
                <TenantStatusBadge status={tenant.status} />
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Total Users</div>
              <div className="text-xl font-semibold text-gray-900">{stats.totalUsers}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Active Users</div>
              <div className="text-xl font-semibold text-gray-900">{stats.activeUsers}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">User Limit</div>
              <div className="text-xl font-semibold text-gray-900">{stats.usersLimit}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Remaining</div>
              <div className="text-xl font-semibold text-gray-900">{stats.usersRemaining}</div>
            </div>
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="tenant_admin">Client Admin</option>
              <option value="facilitator">Facilitator</option>
              <option value="mentor">Mentor</option>
              <option value="learner">Learner</option>
            </select>
            <button
              onClick={() => setShowCreateUser(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
            >
              + Add User
            </button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="text-gray-500">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No users found.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Title / Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {[u.title, u.department].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.roleSlug} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <UserStatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setImpersonateUser({
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email,
                          })}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Login As
                        </button>
                        <button
                          onClick={() => setChangeRoleUser({
                            userId: u.id,
                            userName: `${u.firstName} ${u.lastName}`,
                            currentRole: u.roleSlug,
                          })}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Change Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        tenantId={tenantId}
        tenantName={tenant.name}
      />

      {changeRoleUser && (
        <ChangeRoleModal
          open={true}
          onClose={() => setChangeRoleUser(null)}
          tenantId={tenantId}
          userId={changeRoleUser.userId}
          userName={changeRoleUser.userName}
          currentRole={changeRoleUser.currentRole}
        />
      )}

      {impersonateUser && (
        <ImpersonateUserModal
          open={true}
          onClose={() => setImpersonateUser(null)}
          targetUser={impersonateUser}
        />
      )}
    </div>
  );
}
