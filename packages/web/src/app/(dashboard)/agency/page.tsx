'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Users,
  FileText,
  Palette,
  CreditCard,
  TrendingUp,
  Search,
  Plus,
  ExternalLink,
  Filter,
  Upload,
  Globe,
  Save,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  Copy,
  Trash2,
  Archive,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAgency, useAgencyStats, useAgencyUsers, useUpdateAgency } from '@/hooks/api/useAgency';
import { useTenants } from '@/hooks/api/useTenants';
import { useUsers, type TenantUser } from '@/hooks/api/useUsers';
import {
  useTemplates,
  useTemplateStats,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useUpdateTemplate,
} from '@/hooks/api/useTemplates';
import type { AssessmentTemplate, TemplateConfig } from '@/types/assessments';
import { RoleBadge } from '@/components/agency/RoleBadge';
import { TenantStatusBadge, UserStatusBadge } from '@/components/agency/StatusBadge';
import { CreateTenantModal } from '@/components/agency/CreateTenantModal';
import { CreateUserModal } from '@/components/agency/CreateUserModal';
import { ChangeRoleModal } from '@/components/agency/ChangeRoleModal';
import { ImpersonateUserModal } from '@/components/agency/ImpersonateUserModal';

type Tab = 'overview' | 'clients' | 'people' | 'templates' | 'branding' | 'billing';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'clients', label: 'Clients', icon: <Building2 className="w-4 h-4" /> },
  { id: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
  { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
  { id: 'branding', label: 'Branding', icon: <Palette className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
];

export default function AgencyPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab') as Tab | null;
    return t && ['overview', 'clients', 'people', 'templates', 'branding', 'billing'].includes(t) ? t : 'overview';
  });

  // Sync tab with URL when query param changes (e.g. back-navigation from editor)
  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null;
    if (t && ['overview', 'clients', 'people', 'templates', 'branding', 'billing'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  if (!user?.agencyId) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="p-8 text-center text-gray-500">
          Agency access required. Please log in with an agency account.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Building2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Agency Portal</h1>
            <p className="text-gray-500">Manage clients, templates, and platform settings</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab onSwitchTab={setActiveTab} />}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================
function OverviewTab({ onSwitchTab }: { onSwitchTab: (tab: Tab) => void }) {
  const { data: stats, isLoading } = useAgencyStats();
  const { data: tenants } = useTenants();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const recentClients = (tenants || []).slice(0, 5);
  const avgUsersPerClient = stats?.totalTenants
    ? Math.round((stats?.totalUsers || 0) / stats.totalTenants)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalTenants ?? 0}</div>
          <div className="text-sm text-gray-500">Total Clients</div>
          <div className="text-xs text-green-600 mt-1">{stats?.activeTenants ?? 0} active</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(stats?.totalUsers ?? 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-xs text-gray-500 mt-1">~{avgUsersPerClient} per client</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.agencyUsers ?? 0}</div>
          <div className="text-sm text-gray-500">Agency Staff</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.activeTenants && stats?.totalTenants
              ? Math.round((stats.activeTenants / stats.totalTenants) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Active Rate</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Clients</h3>
            <button
              onClick={() => onSwitchTab('clients')}
              className="text-sm text-red-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/agency/clients/${client.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-medium text-sm">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">
                        {client.userCount ?? 0} users
                      </div>
                    </div>
                  </div>
                  <TenantStatusBadge status={client.status} />
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500">No clients yet.</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Active Clients</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{stats?.activeTenants ?? 0}</div>
              <div className="text-xs text-green-600 mt-1">
                of {stats?.totalTenants ?? 0} total
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Total Platform Users</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{stats?.totalUsers ?? 0}</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700">Agency Team</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{stats?.agencyUsers ?? 0}</div>
              <div className="text-xs text-purple-600 mt-1">staff members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Clients Tab
// ============================================
function ClientsTab() {
  const { data: tenants, isLoading } = useTenants();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = (tenants || []).filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Client Management</h2>
          <p className="text-sm text-gray-500">Manage your client organizations and subscriptions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="churned">Churned</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {(tenants || []).length} clients
      </div>

      {/* Clients Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium mb-2">No Clients Found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first client to get started'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Add Client
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Industry</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Users</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <Link href={`/agency/clients/${tenant.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-medium text-sm shrink-0">
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                            {tenant.name}
                          </div>
                          <div className="text-sm text-gray-500">{tenant.slug}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <TenantStatusBadge status={tenant.status} />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500 hidden sm:table-cell">
                      {tenant.industry || '-'}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{tenant.userCount ?? 0}</span>
                        <span className="text-gray-400">/ {tenant.usersLimit}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {tenant.domain && (
                          <button
                            onClick={() => window.open(`https://${tenant.domain}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Open domain"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/agency/clients/${tenant.id}`}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTenantModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}

// ============================================
// People Tab
// ============================================
function PeopleTab() {
  const { data: tenants } = useTenants();
  const { data: agencyUsers } = useAgencyUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<{
    userId: string;
    userName: string;
    currentRole: string | null;
    tenantId: string;
  } | null>(null);
  const [impersonateUser, setImpersonateUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  const activeTenantId = selectedTenant !== 'all' && selectedTenant !== 'agency'
    ? selectedTenant
    : (tenants && tenants.length > 0 ? tenants[0].id : undefined);

  const { data: tenantUsersResponse } = useUsers(
    selectedTenant === 'agency' ? undefined : activeTenantId,
    { limit: 100 }
  );

  const allUsers: (TenantUser & { tenantName: string; tenantId: string })[] = [];

  if (selectedTenant === 'all' || selectedTenant === 'agency') {
    (agencyUsers || []).forEach((u) => {
      allUsers.push({ ...u, tenantName: 'Agency Staff', tenantId: '' });
    });
  }

  if (selectedTenant !== 'agency') {
    const tenantUsers = tenantUsersResponse?.data || [];
    const tenantName = tenants?.find((t) => t.id === activeTenantId)?.name || '';
    tenantUsers.forEach((u) => {
      allUsers.push({ ...u, tenantName, tenantId: activeTenantId || '' });
    });
  }

  const filtered = allUsers.filter((u) => {
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          />
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          >
            <option value="all">All</option>
            <option value="agency">Agency Staff</option>
            {(tenants || []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="agency_owner">Agency Owner</option>
            <option value="agency_admin">Agency Admin</option>
            <option value="tenant_admin">Client Admin</option>
            <option value="facilitator">Facilitator</option>
            <option value="mentor">Mentor</option>
            <option value="learner">Learner</option>
          </select>
        </div>
        {activeTenantId && selectedTenant !== 'agency' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
          >
            + Add User
          </button>
        )}
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Organization</th>
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
                    {u.tenantName}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.roleSlug} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <UserStatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {u.tenantId && (
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
                      )}
                      {u.tenantId && (
                        <button
                          onClick={() => setChangeRoleUser({
                            userId: u.id,
                            userName: `${u.firstName} ${u.lastName}`,
                            currentRole: u.roleSlug,
                            tenantId: u.tenantId,
                          })}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Change Role
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTenantId && (
        <CreateUserModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          tenantId={activeTenantId}
          tenantName={tenants?.find((t) => t.id === activeTenantId)?.name}
        />
      )}

      {changeRoleUser && (
        <ChangeRoleModal
          open={true}
          onClose={() => setChangeRoleUser(null)}
          tenantId={changeRoleUser.tenantId}
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

// ============================================
// Templates Tab
// ============================================

function defaultConfig(assessmentType: '180' | '360' | 'custom'): TemplateConfig {
  return {
    competencies: [{
      id: crypto.randomUUID(),
      name: 'Leadership Effectiveness',
      questions: [{ id: crypto.randomUUID(), text: 'Demonstrates strong leadership capabilities' }],
    }],
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    allowComments: true,
    requireComments: false,
    anonymizeResponses: true,
    raterTypes: assessmentType === '180' ? ['self', 'manager'] : ['self', 'manager', 'peer', 'direct_report'],
  };
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

function TemplatesTab() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'360' | '180' | 'custom'>('360');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const openCreateModal = () => {
    setNewName('');
    setNewType('360');
    setNewDesc('');
    setCreateError(null);
    setShowCreate(true);
  };

  const { data, isLoading } = useTemplates(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const { data: stats } = useTemplateStats();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const updateTemplate = useUpdateTemplate();

  const templates = data?.templates ?? [];

  const filtered = templates.filter((t) => {
    if (typeFilter !== 'all' && t.assessmentType !== typeFilter) return false;
    if (!search) return true;
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateError(null);
    try {
      const t = await createTemplate.mutateAsync({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        assessmentType: newType,
        config: defaultConfig(newType),
      });
      setShowCreate(false);
      router.push(`/agency/assessments/${t.id}`);
    } catch (err) {
      setCreateError((err as Error)?.message ?? 'Failed to create template. Please try again.');
    }
  };

  const handleDelete = async (t: AssessmentTemplate) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    await deleteTemplate.mutateAsync(t.id);
  };

  const handleArchive = async (t: AssessmentTemplate) => {
    const next = t.status === 'archived' ? 'draft' : 'archived';
    await updateTemplate.mutateAsync({ templateId: t.id, status: next });
    setOpenMenuId(null);
  };

  const handlePublish = async (t: AssessmentTemplate) => {
    await updateTemplate.mutateAsync({ templateId: t.id, status: 'published' });
    setOpenMenuId(null);
  };

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const TYPE_LABELS: Record<string, string> = { '180': '180°', '360': '360°', custom: 'Custom' };
  const TYPE_COLORS: Record<string, string> = {
    '180': 'bg-blue-100 text-blue-700',
    '360': 'bg-purple-100 text-purple-700',
    custom: 'bg-teal-100 text-teal-700',
  };
  const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
    published: { label: 'Published', icon: <CheckCircle2 className="w-3 h-3" />, classes: 'bg-green-100 text-green-700' },
    draft:     { label: 'Draft',     icon: <Clock className="w-3 h-3" />,         classes: 'bg-yellow-100 text-yellow-700' },
    archived:  { label: 'Archived',  icon: <Archive className="w-3 h-3" />,       classes: 'bg-gray-100 text-gray-500' },
  };

  const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all',       label: `All (${stats?.total ?? 0})` },
    { id: 'published', label: `Published (${stats?.published ?? 0})` },
    { id: 'draft',     label: `Draft (${stats?.draft ?? 0})` },
    { id: 'archived',  label: `Archived (${stats?.archived ?? 0})` },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Assessment Templates</h2>
          <p className="text-sm text-gray-500">Build and publish 180° / 360° templates for your clients</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: <FileText className="w-4 h-4 text-red-600" />, bg: 'bg-red-50' },
          { label: 'Published', value: stats?.published ?? 0, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Draft', value: stats?.draft ?? 0, icon: <Clock className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-50' },
          { label: 'Archived', value: stats?.archived ?? 0, icon: <Archive className="w-4 h-4 text-gray-500" />, bg: 'bg-gray-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status tabs + search + type filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg text-sm">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none w-52"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          >
            <option value="all">All types</option>
            <option value="360">360°</option>
            <option value="180">180°</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">No templates found</p>
          <p className="text-sm text-gray-500 mb-4">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first assessment template to get started.'}
          </p>
          {!search && statusFilter === 'all' && typeFilter === 'all' && (
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              New Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const sc = STATUS_CONFIG[t.status];
            const compCount = t.config?.competencies?.length ?? 0;
            const qCount = t.config?.competencies?.reduce((n, c) => n + c.questions.length, 0) ?? 0;
            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-200 hover:shadow-sm transition-all flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[t.assessmentType]}`}>
                          {TYPE_LABELS[t.assessmentType]}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.classes}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === t.id ? null : t.id); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === t.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 text-sm">
                          <button
                            onClick={() => { setOpenMenuId(null); router.push(`/agency/assessments/${t.id}`); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            Edit template
                          </button>
                          {t.status !== 'published' && (
                            <button
                              onClick={() => void handlePublish(t)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => void handleArchive(t)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            {t.status === 'archived' ? 'Restore to draft' : 'Archive'}
                          </button>
                          <button
                            onClick={() => { setOpenMenuId(null); void duplicateTemplate.mutateAsync(t.id); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" /> Duplicate
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => { setOpenMenuId(null); void handleDelete(t); }}
                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {t.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 -mt-1">{t.description}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {compCount} {compCount === 1 ? 'competency' : 'competencies'} · {qCount} questions
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Updated {formatDate(t.updatedAt)}</span>
                    <button
                      onClick={() => router.push(`/agency/assessments/${t.id}`)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Edit →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Template Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">New Assessment Template</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template name <span className="text-red-500">*</span></label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                  placeholder="e.g. Leadership 360"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as '360' | '180' | 'custom')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                >
                  <option value="360">360° — Self + Manager + Peers + Direct Reports</option>
                  <option value="180">180° — Self + Manager only</option>
                  <option value="custom">Custom — configure rater types manually</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="What is this template used for?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                />
              </div>
            </div>
            {createError && (
              <p className="px-5 pb-3 text-xs text-red-600 flex items-center gap-1">
                <span className="font-medium">Error:</span> {createError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={!newName.trim() || createTemplate.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {createTemplate.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create &amp; Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Branding Tab
// ============================================
function BrandingTab() {
  const { data: agency, isLoading } = useAgency();
  const updateAgency = useUpdateAgency();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1F2937');
  const [accentColor, setAccentColor] = useState('#E53E3E');
  const [domain, setDomain] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from agency data
  if (agency && !initialized) {
    setCompanyName(agency.name || '');
    setPrimaryColor(agency.primaryColor || '#1F2937');
    setAccentColor(agency.accentColor || '#E53E3E');
    setDomain(agency.domain || '');
    setInitialized(true);
  }

  const presetColors = [
    { name: 'Red', primary: '#1F2937', accent: '#E53E3E' },
    { name: 'Blue', primary: '#1E3A5F', accent: '#3B82F6' },
    { name: 'Green', primary: '#1F2937', accent: '#10B981' },
    { name: 'Purple', primary: '#2D1B4E', accent: '#8B5CF6' },
    { name: 'Orange', primary: '#1F2937', accent: '#F97316' },
    { name: 'Teal', primary: '#134E4A', accent: '#14B8A6' },
  ];

  const handleSave = async () => {
    try {
      await updateAgency.mutateAsync({
        name: companyName,
        primaryColor,
        accentColor,
        domain: domain || null,
      });
      setHasChanges(false);
      setSaveMessage('Changes saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save changes. Please try again.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Branding & Customization</h2>
          <p className="text-sm text-gray-500">Customize the look and feel of your platform</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updateAgency.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateAgency.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo & Identity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <Palette className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Logo & Identity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-300 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload logo</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, SVG up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setHasChanges(true); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">Color Presets</label>
              <div className="flex items-center gap-3 flex-wrap">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setAccentColor(preset.accent);
                      setHasChanges(true);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      primaryColor === preset.primary && accentColor === preset.accent
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                    <span className="text-sm text-gray-700">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); setHasChanges(true); }}
                    className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => { setPrimaryColor(e.target.value); setHasChanges(true); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => { setAccentColor(e.target.value); setHasChanges(true); }}
                    className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => { setAccentColor(e.target.value); setHasChanges(true); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Domain */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Domain</h3>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Domain
                </div>
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => { setDomain(e.target.value); setHasChanges(true); }}
                placeholder="app.yourcompany.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Point your CNAME record to platform.transformationos.com
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>

            {/* Mini Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ backgroundColor: primaryColor }}>
              {/* Header */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {companyName.slice(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {companyName || 'Company Name'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-white/5">
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
                <button
                  className="mt-4 px-3 py-1.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Button
                </button>
              </div>

              {/* Cards */}
              <div className="p-4 bg-gray-50 grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="h-2 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={() => {
                  setPrimaryColor('#1F2937');
                  setAccentColor('#E53E3E');
                  setHasChanges(true);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Billing Tab
// ============================================
function BillingTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing & Revenue</h2>
          <p className="text-sm text-gray-500">Track revenue, manage subscriptions, and view transaction history</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Billing Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          We&apos;re building powerful billing and revenue tracking tools. You&apos;ll be able to manage subscriptions,
          view transaction history, and track revenue by tier.
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Revenue Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Subscription Management</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Invoice Generation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
