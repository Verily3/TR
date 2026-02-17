'use client';

import { useState } from 'react';
import {
  Shield,
  Lock,
  Search,
  RotateCcw,
  X,
  Loader2,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useRolePermissions,
  useUpdateRolePermissions,
  useResetRolePermissions,
  useUserPermissionOverrides,
  useUpdateUserPermissions,
  useDeleteUserPermissions,
  type RolePermissionConfig,
  type UserPermissionOverride,
} from '@/hooks/api/usePermissions';
import { useUsers, type TenantUser } from '@/hooks/api/useUsers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The canonical list of nav item slugs to show in the matrix. */
const ALL_NAV_ITEMS: { slug: string; label: string }[] = [
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'programs', label: 'Programs' },
  { slug: 'mentoring', label: 'Mentoring' },
  { slug: 'assessments', label: 'Assessments' },
  { slug: 'scorecard', label: 'Scorecard' },
  { slug: 'planning', label: 'Planning' },
  { slug: 'people', label: 'People' },
  { slug: 'analytics', label: 'Analytics' },
  { slug: 'notifications', label: 'Notifications' },
  { slug: 'help', label: 'Help & Support' },
  { slug: 'settings', label: 'Settings' },
];

/** The roles to show as columns in the matrix (in order). */
const ROLE_COLUMNS = ['learner', 'mentor', 'facilitator', 'tenant_admin'];

const ROLE_LABELS: Record<string, string> = {
  learner: 'Learner',
  mentor: 'Mentor',
  facilitator: 'Facilitator',
  tenant_admin: 'Tenant Admin',
};

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-accent' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={checked}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Role Permissions Tab
// ---------------------------------------------------------------------------

function RolePermissionsTab({ tenantId }: { tenantId: string }) {
  const { data: roles = [], isLoading } = useRolePermissions(tenantId);
  const updateRole = useUpdateRolePermissions(tenantId);
  const resetRole = useResetRolePermissions(tenantId);

  // Map role slugs to their config
  const roleMap: Record<string, RolePermissionConfig> = {};
  roles.forEach((r) => (roleMap[r.roleSlug] = r));

  const handleToggle = (roleSlug: string, navSlug: string, currentlyOn: boolean) => {
    const role = roleMap[roleSlug];
    if (!role) return;

    let newNavItems: string[];
    if (currentlyOn) {
      newNavItems = role.navItems.filter((n) => n !== navSlug);
    } else {
      newNavItems = [...role.navItems, navSlug];
    }

    updateRole.mutate({ roleSlug, navItems: newNavItems });
  };

  const handleReset = (roleSlug: string) => {
    resetRole.mutate(roleSlug);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-sidebar-foreground">Role Permissions Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Toggle which navigation items each role can access. Changes apply immediately.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-4 text-muted-foreground font-medium w-40">
                Navigation Item
              </th>
              {ROLE_COLUMNS.map((roleSlug) => {
                const role = roleMap[roleSlug];
                return (
                  <th key={roleSlug} className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sidebar-foreground font-medium">
                          {ROLE_LABELS[roleSlug] ?? roleSlug}
                        </span>
                        {role?.isCustomised && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-accent rounded text-xs font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      {role && (
                        <button
                          onClick={() => handleReset(roleSlug)}
                          disabled={!role.isCustomised || resetRole.isPending}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Reset to defaults"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ALL_NAV_ITEMS.map((navItem, idx) => (
              <tr
                key={navItem.slug}
                className={`border-b border-border last:border-0 ${
                  idx % 2 === 0 ? '' : 'bg-muted/20'
                }`}
              >
                <td className="px-5 py-3 text-sidebar-foreground font-medium">
                  {navItem.label}
                </td>
                {ROLE_COLUMNS.map((roleSlug) => {
                  const role = roleMap[roleSlug];
                  const isOn = role?.navItems.includes(navItem.slug) ?? false;
                  const isSaving =
                    updateRole.isPending && updateRole.variables?.roleSlug === roleSlug;
                  return (
                    <td key={roleSlug} className="px-5 py-3 text-center">
                      {role ? (
                        <div className="flex justify-center">
                          <Toggle
                            checked={isOn}
                            onChange={() => handleToggle(roleSlug, navItem.slug, isOn)}
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Permissions Modal
// ---------------------------------------------------------------------------

function UserPermissionsModal({
  user,
  tenantId,
  roleNavItems,
  currentOverride,
  onClose,
}: {
  user: TenantUser;
  tenantId: string;
  roleNavItems: string[];
  currentOverride: UserPermissionOverride | undefined;
  onClose: () => void;
}) {
  const updateUserPerms = useUpdateUserPermissions(tenantId);
  const deleteUserPerms = useDeleteUserPermissions(tenantId);

  // Granted = items NOT in role but being added
  const [granted, setGranted] = useState<string[]>(currentOverride?.grantedNavItems ?? []);
  // Revoked = items IN role being removed
  const [revoked, setRevoked] = useState<string[]>(currentOverride?.revokedNavItems ?? []);

  const extraItems = ALL_NAV_ITEMS.filter((n) => !roleNavItems.includes(n.slug));
  const revokeableItems = ALL_NAV_ITEMS.filter((n) => roleNavItems.includes(n.slug));

  // Effective nav = role items - revoked + granted
  const effective = [
    ...roleNavItems.filter((n) => !revoked.includes(n)),
    ...granted.filter((n) => !roleNavItems.includes(n)),
  ];

  const handleSave = async () => {
    await updateUserPerms.mutateAsync({
      userId: user.id,
      grantedNavItems: granted,
      revokedNavItems: revoked,
    });
    onClose();
  };

  const handleRemoveAll = async () => {
    await deleteUserPerms.mutateAsync(user.id);
    onClose();
  };

  const toggleGranted = (slug: string) => {
    setGranted((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleRevoked = (slug: string) => {
    setRevoked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const isPending = updateUserPerms.isPending || deleteUserPerms.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-accent flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user.roleName ?? user.roleSlug ?? 'No role'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Base Role Items (read-only) */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
              Base Role Access
              <span className="ml-2 text-muted-foreground font-normal">(from {user.roleName ?? user.roleSlug})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {roleNavItems.length === 0 ? (
                <span className="text-sm text-muted-foreground">No base nav items</span>
              ) : (
                roleNavItems.map((slug) => {
                  const nav = ALL_NAV_ITEMS.find((n) => n.slug === slug);
                  return (
                    <span
                      key={slug}
                      className="px-2.5 py-1 bg-muted text-muted-foreground rounded text-xs"
                    >
                      {nav?.label ?? slug}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Grant Extra Access */}
          {extraItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
                Grant Extra Access
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Items not in their role — check to grant access.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {extraItems.map((navItem) => {
                  const isGranted = granted.includes(navItem.slug);
                  return (
                    <label
                      key={navItem.slug}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isGranted
                          ? 'border-accent bg-red-50 text-accent'
                          : 'border-border text-muted-foreground hover:border-accent/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isGranted}
                        onChange={() => toggleGranted(navItem.slug)}
                        className="accent-accent"
                      />
                      <span className="text-sm">{navItem.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Revoke Access */}
          {revokeableItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
                Revoke Access
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Items in their role — check to revoke access.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {revokeableItems.map((navItem) => {
                  const isRevoked = revoked.includes(navItem.slug);
                  return (
                    <label
                      key={navItem.slug}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isRevoked
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-border text-muted-foreground hover:border-red-300/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isRevoked}
                        onChange={() => toggleRevoked(navItem.slug)}
                        className="accent-red-600"
                      />
                      <span className="text-sm">{navItem.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-foreground mb-2">
              Effective Navigation
              <span className="ml-2 text-muted-foreground font-normal">(preview)</span>
            </h3>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg min-h-[44px]">
              {effective.length === 0 ? (
                <span className="text-sm text-muted-foreground">No nav items</span>
              ) : (
                effective.map((slug) => {
                  const nav = ALL_NAV_ITEMS.find((n) => n.slug === slug);
                  const isGrantedExtra = granted.includes(slug);
                  return (
                    <span
                      key={slug}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        isGrantedExtra
                          ? 'bg-red-50 text-accent border border-accent/30'
                          : 'bg-muted text-sidebar-foreground'
                      }`}
                    >
                      {nav?.label ?? slug}
                      {isGrantedExtra && ' +'}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {currentOverride && (
              <button
                onClick={handleRemoveAll}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Remove All Overrides
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Overrides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Overrides Tab
// ---------------------------------------------------------------------------

function UserOverridesTab({
  tenantId,
  roles,
}: {
  tenantId: string;
  roles: RolePermissionConfig[];
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

  const { data: usersResponse, isLoading: usersLoading } = useUsers(tenantId, {
    search: search || undefined,
  });
  const { data: overrides = [], isLoading: overridesLoading } =
    useUserPermissionOverrides(tenantId);

  const users: TenantUser[] = (usersResponse?.data ?? []) as TenantUser[];

  // Map override by userId
  const overrideMap: Record<string, UserPermissionOverride> = {};
  overrides.forEach((o) => (overrideMap[o.userId] = o));

  // Map role config by slug
  const roleMap: Record<string, RolePermissionConfig> = {};
  roles.forEach((r) => (roleMap[r.roleSlug] = r));

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.roleSlug !== roleFilter) return false;
    return true;
  });

  const isLoading = usersLoading || overridesLoading;

  const getRoleNavItems = (u: TenantUser): string[] => {
    if (!u.roleSlug) return [];
    return roleMap[u.roleSlug]?.navItems ?? [];
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-sidebar-foreground">User Permission Overrides</h2>
        <p className="text-sm text-muted-foreground">
          Grant or revoke specific nav items for individual users, on top of their role defaults.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 bg-card border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm cursor-pointer"
          >
            <option value="all">All Roles</option>
            {ROLE_COLUMNS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {filteredUsers.map((u) => {
            const override = overrideMap[u.id];
            const hasOverride = !!override;
            const initials =
              `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

            return (
              <div
                key={u.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-accent flex items-center justify-center text-sm font-medium shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sidebar-foreground text-sm">
                        {u.firstName} {u.lastName}
                      </span>
                      {hasOverride && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-accent rounded text-xs font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{u.email}</span>
                      <span>&middot;</span>
                      <span>{u.roleName ?? u.roleSlug ?? 'No role'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(u)}
                  className="ml-4 shrink-0 px-3 py-1.5 border border-border rounded-lg text-xs text-sidebar-foreground hover:border-accent/40 hover:bg-muted/30 transition-colors"
                >
                  Customize
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* User Permissions Modal */}
      {selectedUser && (
        <UserPermissionsModal
          user={selectedUser}
          tenantId={tenantId}
          roleNavItems={getRoleNavItems(selectedUser)}
          currentOverride={overrideMap[selectedUser.id]}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Permissions Page
// ---------------------------------------------------------------------------

type PermTab = 'roles' | 'users';

export default function PermissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PermTab>('roles');

  const tenantId = user?.tenantId;
  const roleLevel = user?.roleLevel ?? 0;

  // Access guard — must be roleLevel >= 70
  if (roleLevel < 70) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="p-4 bg-red-50 rounded-full">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm">
            You do not have permission to manage role permissions. This area requires Tenant Admin
            access.
          </p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-16 text-muted-foreground">
          No tenant context. Please select a tenant first.
        </div>
      </div>
    );
  }

  // Load roles for both tabs (needed by UserOverridesTab)
  const { data: roles = [] } = useRolePermissions(tenantId);

  const tabs: { id: PermTab; label: string }[] = [
    { id: 'roles', label: 'Role Permissions' },
    { id: 'users', label: 'User Overrides' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground">
              Permissions
            </h1>
            <p className="text-muted-foreground text-sm">
              Control navigation access by role and individual user overrides
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-sidebar-foreground hover:bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && <RolePermissionsTab tenantId={tenantId} />}
      {activeTab === 'users' && <UserOverridesTab tenantId={tenantId} roles={roles} />}
    </div>
  );
}
