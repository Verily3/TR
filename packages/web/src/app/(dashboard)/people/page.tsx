'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Grid3X3,
  List,
  Building2,
  Briefcase,
  MapPin,
  TrendingUp,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers, type TenantUser } from '@/hooks/api/useUsers';

// ============================================================================
// Types
// ============================================================================

type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'contractor';
type UserRole = 'admin' | 'manager' | 'employee' | 'contractor';
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | EmploymentStatus;

interface Person {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  title: string;
  department: string;
  departmentId: string;
  team?: string;
  teamId?: string;
  managerId?: string;
  managerName?: string;
  employmentStatus: EmploymentStatus;
  userRole: UserRole;
  startDate: string;
  location?: string;
  phone?: string;
  skills?: string[];
  directReports?: number;
  bio?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  memberCount: number;
}

interface PeopleStats {
  totalPeople: number;
  activeEmployees: number;
  onLeave: number;
  contractors: number;
  newThisMonth: number;
  departments: number;
  teams: number;
}

// ============================================================================
// Status & Role Configuration
// ============================================================================

const employmentStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700' },
  on_leave: { label: 'On Leave', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  terminated: { label: 'Terminated', bg: 'bg-red-100', text: 'text-red-700' },
  contractor: { label: 'Contractor', bg: 'bg-purple-100', text: 'text-purple-700' },
};

const filterOptions: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All People' },
  { id: 'active', label: 'Active' },
  { id: 'on_leave', label: 'On Leave' },
  { id: 'contractor', label: 'Contractors' },
];

// ============================================================================
// Mock Data
// ============================================================================

const mockDepartments: Department[] = [
  { id: 'dept1', name: 'Executive', description: 'Executive leadership team', memberCount: 3 },
  { id: 'dept2', name: 'Engineering', description: 'Product development and engineering', headId: 'p3', memberCount: 12 },
  { id: 'dept3', name: 'Sales', description: 'Sales and business development', headId: 'p4', memberCount: 8 },
  { id: 'dept4', name: 'Marketing', description: 'Marketing and communications', headId: 'p5', memberCount: 6 },
  { id: 'dept5', name: 'Human Resources', description: 'People operations and HR', headId: 'p6', memberCount: 4 },
  { id: 'dept6', name: 'Finance', description: 'Finance and accounting', headId: 'p7', memberCount: 5 },
];

const mockPeople: Person[] = [
  {
    id: 'p1',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    role: 'CEO',
    title: 'Chief Executive Officer',
    department: 'Executive',
    departmentId: 'dept1',
    employmentStatus: 'active',
    userRole: 'admin',
    startDate: '2018-03-15',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0001',
    directReports: 5,
    skills: ['Leadership', 'Strategy', 'Business Development'],
    bio: 'Visionary leader with 20+ years of experience in technology and business transformation.',
  },
  {
    id: 'p2',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'COO',
    title: 'Chief Operating Officer',
    department: 'Executive',
    departmentId: 'dept1',
    managerId: 'p1',
    managerName: 'James Wilson',
    employmentStatus: 'active',
    userRole: 'admin',
    startDate: '2019-06-01',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0002',
    directReports: 4,
    skills: ['Operations', 'Process Optimization', 'Team Building'],
  },
  {
    id: 'p3',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    role: 'VP Engineering',
    title: 'Vice President of Engineering',
    department: 'Engineering',
    departmentId: 'dept2',
    managerId: 'p1',
    managerName: 'James Wilson',
    employmentStatus: 'active',
    userRole: 'admin',
    startDate: '2019-01-15',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0003',
    directReports: 4,
    skills: ['Software Architecture', 'Team Leadership', 'Agile'],
  },
  {
    id: 'p4',
    name: 'Emily Thompson',
    email: 'emily.thompson@company.com',
    role: 'VP Sales',
    title: 'Vice President of Sales',
    department: 'Sales',
    departmentId: 'dept3',
    managerId: 'p2',
    managerName: 'Sarah Chen',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2020-02-01',
    location: 'New York, NY',
    phone: '+1 (555) 100-0004',
    directReports: 3,
    skills: ['Sales Strategy', 'Enterprise Sales', 'Negotiation'],
  },
  {
    id: 'p5',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'VP Marketing',
    title: 'Vice President of Marketing',
    department: 'Marketing',
    departmentId: 'dept4',
    managerId: 'p2',
    managerName: 'Sarah Chen',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2020-05-15',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0005',
    directReports: 2,
    skills: ['Brand Strategy', 'Digital Marketing', 'Content'],
  },
  {
    id: 'p6',
    name: 'Amanda Foster',
    email: 'amanda.foster@company.com',
    role: 'HR Director',
    title: 'Director of Human Resources',
    department: 'Human Resources',
    departmentId: 'dept5',
    managerId: 'p2',
    managerName: 'Sarah Chen',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2019-09-01',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0006',
    directReports: 3,
    skills: ['Talent Acquisition', 'Employee Relations', 'HR Strategy'],
  },
  {
    id: 'p7',
    name: 'Robert Martinez',
    email: 'robert.martinez@company.com',
    role: 'CFO',
    title: 'Chief Financial Officer',
    department: 'Finance',
    departmentId: 'dept6',
    managerId: 'p1',
    managerName: 'James Wilson',
    employmentStatus: 'active',
    userRole: 'admin',
    startDate: '2019-04-01',
    location: 'San Francisco, CA',
    phone: '+1 (555) 100-0007',
    directReports: 2,
    skills: ['Financial Planning', 'M&A', 'Investor Relations'],
  },
  {
    id: 'p8',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    role: 'Engineering Manager',
    title: 'Engineering Manager - Platform',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Platform Team',
    teamId: 'team1',
    managerId: 'p3',
    managerName: 'Michael Rodriguez',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2020-03-15',
    location: 'San Francisco, CA',
    directReports: 4,
    skills: ['Backend Development', 'System Design', 'Python', 'Go'],
  },
  {
    id: 'p9',
    name: 'Alex Johnson',
    email: 'alex.johnson@company.com',
    role: 'Senior Engineer',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Platform Team',
    teamId: 'team1',
    managerId: 'p8',
    managerName: 'Jennifer Lee',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2021-01-10',
    location: 'Austin, TX',
    skills: ['React', 'TypeScript', 'Node.js'],
  },
  {
    id: 'p10',
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    role: 'Software Engineer',
    title: 'Software Engineer II',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Platform Team',
    teamId: 'team1',
    managerId: 'p8',
    managerName: 'Jennifer Lee',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2022-06-01',
    location: 'Remote',
    skills: ['Python', 'AWS', 'Kubernetes'],
  },
  {
    id: 'p11',
    name: 'Chris Taylor',
    email: 'chris.taylor@company.com',
    role: 'Junior Engineer',
    title: 'Software Engineer I',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Platform Team',
    teamId: 'team1',
    managerId: 'p8',
    managerName: 'Jennifer Lee',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2024-01-15',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'SQL'],
  },
  {
    id: 'p12',
    name: 'Kevin Patel',
    email: 'kevin.patel@company.com',
    role: 'Engineering Manager',
    title: 'Engineering Manager - Mobile',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Mobile Team',
    teamId: 'team2',
    managerId: 'p3',
    managerName: 'Michael Rodriguez',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2020-08-01',
    location: 'San Francisco, CA',
    directReports: 3,
    skills: ['iOS', 'Android', 'React Native', 'Flutter'],
  },
  {
    id: 'p13',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    role: 'iOS Developer',
    title: 'Senior iOS Developer',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Mobile Team',
    teamId: 'team2',
    managerId: 'p12',
    managerName: 'Kevin Patel',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2021-04-01',
    location: 'Seattle, WA',
    skills: ['Swift', 'iOS', 'UIKit', 'SwiftUI'],
  },
  {
    id: 'p14',
    name: 'Tom Anderson',
    email: 'tom.anderson@company.com',
    role: 'Android Developer',
    title: 'Android Developer',
    department: 'Engineering',
    departmentId: 'dept2',
    team: 'Mobile Team',
    teamId: 'team2',
    managerId: 'p12',
    managerName: 'Kevin Patel',
    employmentStatus: 'on_leave',
    userRole: 'employee',
    startDate: '2022-02-15',
    location: 'Remote',
    skills: ['Kotlin', 'Android', 'Jetpack Compose'],
  },
  {
    id: 'p15',
    name: 'Rachel Green',
    email: 'rachel.green@company.com',
    role: 'Sales Manager',
    title: 'Enterprise Sales Manager',
    department: 'Sales',
    departmentId: 'dept3',
    team: 'Enterprise Sales',
    teamId: 'team3',
    managerId: 'p4',
    managerName: 'Emily Thompson',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2021-03-01',
    location: 'New York, NY',
    directReports: 2,
    skills: ['Enterprise Sales', 'Account Management', 'CRM'],
  },
  {
    id: 'p16',
    name: 'Mark Stevens',
    email: 'mark.stevens@company.com',
    role: 'Account Executive',
    title: 'Senior Account Executive',
    department: 'Sales',
    departmentId: 'dept3',
    team: 'Enterprise Sales',
    teamId: 'team3',
    managerId: 'p15',
    managerName: 'Rachel Green',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2021-09-01',
    location: 'Chicago, IL',
    skills: ['B2B Sales', 'Negotiation', 'Salesforce'],
  },
  {
    id: 'p17',
    name: 'Nicole Brown',
    email: 'nicole.brown@company.com',
    role: 'SDR',
    title: 'Sales Development Representative',
    department: 'Sales',
    departmentId: 'dept3',
    team: 'Enterprise Sales',
    teamId: 'team3',
    managerId: 'p15',
    managerName: 'Rachel Green',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2023-06-01',
    location: 'New York, NY',
    skills: ['Lead Generation', 'Cold Calling', 'Email Outreach'],
  },
  {
    id: 'p18',
    name: 'Sophie Turner',
    email: 'sophie.turner@company.com',
    role: 'Marketing Manager',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    departmentId: 'dept4',
    team: 'Growth Marketing',
    teamId: 'team4',
    managerId: 'p5',
    managerName: 'David Kim',
    employmentStatus: 'active',
    userRole: 'manager',
    startDate: '2021-07-01',
    location: 'San Francisco, CA',
    directReports: 1,
    skills: ['Growth Hacking', 'Analytics', 'SEO/SEM'],
  },
  {
    id: 'p19',
    name: 'Daniel Park',
    email: 'daniel.park@company.com',
    role: 'Content Specialist',
    title: 'Content Marketing Specialist',
    department: 'Marketing',
    departmentId: 'dept4',
    team: 'Growth Marketing',
    teamId: 'team4',
    managerId: 'p18',
    managerName: 'Sophie Turner',
    employmentStatus: 'active',
    userRole: 'employee',
    startDate: '2022-11-01',
    location: 'Remote',
    skills: ['Content Writing', 'SEO', 'Social Media'],
  },
  {
    id: 'p20',
    name: 'Sam Mitchell',
    email: 'sam.mitchell@contractor.com',
    role: 'Contractor',
    title: 'UX Design Contractor',
    department: 'Engineering',
    departmentId: 'dept2',
    managerId: 'p3',
    managerName: 'Michael Rodriguez',
    employmentStatus: 'contractor',
    userRole: 'contractor',
    startDate: '2024-09-01',
    location: 'Remote',
    skills: ['UX Design', 'Figma', 'User Research'],
  },
];

const mockStats: PeopleStats = {
  totalPeople: 20,
  activeEmployees: 18,
  onLeave: 1,
  contractors: 1,
  newThisMonth: 2,
  departments: 6,
  teams: 4,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function mapApiUsersToPeople(apiUsers: TenantUser[]): Person[] {
  return apiUsers.map((u) => ({
    id: u.id,
    name: u.displayName || `${u.firstName} ${u.lastName}`,
    email: u.email,
    avatar: u.avatar || undefined,
    role: u.roleName || u.roleSlug || 'Employee',
    title: u.title || u.roleName || 'Team Member',
    department: u.department || 'General',
    departmentId: u.department?.toLowerCase().replace(/\s+/g, '-') || 'general',
    employmentStatus: u.status === 'active' ? 'active' : u.status === 'suspended' ? 'terminated' : 'active' as EmploymentStatus,
    userRole: (u.roleSlug === 'tenant_admin' || u.roleSlug === 'agency_owner' || u.roleSlug === 'agency_admin')
      ? 'admin'
      : u.roleSlug === 'facilitator'
        ? 'manager'
        : 'employee' as UserRole,
    startDate: u.createdAt,
    location: undefined,
    phone: undefined,
    skills: undefined,
    directReports: undefined,
    bio: undefined,
  }));
}

// ============================================================================
// PersonCard Component
// ============================================================================

function PersonCard({
  person,
  variant = 'grid',
}: {
  person: Person;
  variant?: 'grid' | 'list';
}) {
  const statusConfig = employmentStatusConfig[person.employmentStatus] || employmentStatusConfig.active;

  if (variant === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-red-200 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg font-medium shrink-0">
              {getInitials(person.name)}
            </div>

            {/* Basic Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">
                  {person.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <div className="text-sm text-gray-500">{person.title}</div>
            </div>

            {/* Department & Team (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{person.department}</span>
              </div>
              {person.team && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{person.team}</span>
                </div>
              )}
              {person.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{person.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0">
            {person.directReports != null && person.directReports > 0 && (
              <span className="text-sm text-gray-500 hidden sm:inline">
                {person.directReports} direct report{person.directReports > 1 ? 's' : ''}
              </span>
            )}
            <ArrowRight className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-red-200 transition-colors cursor-pointer">
      <div className="flex flex-col items-center text-center mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl font-medium mb-3">
          {getInitials(person.name)}
        </div>

        {/* Name & Status */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {person.name}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} mb-2`}
        >
          {statusConfig.label}
        </span>

        {/* Title */}
        <div className="text-sm text-gray-500 mb-1">{person.title}</div>

        {/* Department */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Building2 className="w-3 h-3" />
          <span>{person.department}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-4 h-4 shrink-0" />
          <span className="truncate">{person.email}</span>
        </div>
        {person.location && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{person.location}</span>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{person.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {(person.directReports || person.managerName) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          {person.managerName && (
            <span>Reports to: {person.managerName}</span>
          )}
          {person.directReports != null && person.directReports > 0 && (
            <span>{person.directReports} reports</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PeoplePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Attempt to load real user data from the API
  const { data: apiResponse, isLoading } = useUsers(user?.tenantId, { limit: 100 });

  // Map API users to Person[] or fall back to mock data
  const people: Person[] = useMemo(() => {
    const apiUsers = apiResponse?.data;
    if (apiUsers && apiUsers.length > 0) {
      return mapApiUsersToPeople(apiUsers);
    }
    return mockPeople;
  }, [apiResponse]);

  // Derive departments from people data
  const departments: Department[] = useMemo(() => {
    if (apiResponse?.data && apiResponse.data.length > 0) {
      const deptMap = new Map<string, number>();
      people.forEach((p) => {
        deptMap.set(p.department, (deptMap.get(p.department) || 0) + 1);
      });
      return Array.from(deptMap.entries()).map(([name, count]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        memberCount: count,
      }));
    }
    return mockDepartments;
  }, [apiResponse, people]);

  // Compute stats from people data
  const stats: PeopleStats = useMemo(() => {
    if (apiResponse?.data && apiResponse.data.length > 0) {
      const deptSet = new Set(people.map((p) => p.department));
      const teamSet = new Set(people.map((p) => p.team).filter(Boolean));
      return {
        totalPeople: people.length,
        activeEmployees: people.filter((p) => p.employmentStatus === 'active').length,
        onLeave: people.filter((p) => p.employmentStatus === 'on_leave').length,
        contractors: people.filter((p) => p.employmentStatus === 'contractor').length,
        newThisMonth: 0,
        departments: deptSet.size,
        teams: teamSet.size,
      };
    }
    return mockStats;
  }, [apiResponse, people]);

  // Filtering logic
  const filteredPeople = useMemo(() => {
    return people
      .filter((p) =>
        activeFilter === 'all' ? true : p.employmentStatus === activeFilter
      )
      .filter((p) =>
        selectedDepartment === 'all'
          ? true
          : p.departmentId === selectedDepartment
      )
      .filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
        );
      });
  }, [people, activeFilter, selectedDepartment, searchTerm]);

  // Loading state
  if (isLoading) {
    return (
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-6 lg:mb-8">
          <div className="h-8 bg-gray-100 rounded w-32 animate-pulse mb-2" />
          <div className="h-5 bg-gray-100 rounded w-64 animate-pulse" />
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
            People
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Manage your team members, view org structure, and track roles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Person
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xl sm:text-2xl font-medium text-gray-900">
              {stats.totalPeople}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Total People</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xl sm:text-2xl font-medium text-gray-900">
              {stats.activeEmployees}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Active Employees</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xl sm:text-2xl font-medium text-gray-900">
              {stats.departments}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Departments</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xl sm:text-2xl font-medium text-gray-900">
              {stats.teams}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Teams</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <span className="text-xl sm:text-2xl font-medium text-gray-900">
              +{stats.newThisMonth}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">New This Month</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Status Filter - Scrollable on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeFilter === option.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full sm:w-auto"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full lg:w-64 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs sm:text-sm text-gray-500 mb-4">
        Showing {filteredPeople.length} of {people.length} people
      </div>

      {/* People List/Grid */}
      {filteredPeople.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                variant="list"
              />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-2">No People Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : 'Add your first team member to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Add Person
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddModal && (
        <AddPersonModal
          departments={departments}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}

// ============================================================================
// Add Person Modal
// ============================================================================

function AddPersonModal({
  departments,
  onClose,
}: {
  departments: Department[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    departmentId: '',
    location: '',
    startDate: '',
    employmentStatus: 'active',
    userRole: 'employee',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would call the useCreateUser mutation
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add New Person
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Department */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Role & Department
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Employment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Employment Status
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="contractor">Contractor</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    User Role
                  </label>
                  <select
                    value={formData.userRole}
                    onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Add Person
          </button>
        </div>
      </div>
    </div>
  );
}
