// People/Team Management Types

export type EmploymentStatus = "active" | "on_leave" | "terminated" | "contractor";

export type UserRole = "admin" | "manager" | "employee" | "contractor";

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  parentId?: string;
  memberCount: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  leadId?: string;
  memberIds: string[];
}

export interface Person {
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

export interface OrgNode {
  person: Person;
  children: OrgNode[];
  isExpanded?: boolean;
}

export interface PeopleStats {
  totalPeople: number;
  activeEmployees: number;
  onLeave: number;
  contractors: number;
  newThisMonth: number;
  departments: number;
  teams: number;
}

// Props interfaces
export interface PeoplePageProps {
  people?: Person[];
  departments?: Department[];
  teams?: Team[];
  stats?: PeopleStats;
  onViewPerson?: (personId: string) => void;
}

export interface PersonCardProps {
  person: Person;
  onView?: (personId: string) => void;
  variant?: "grid" | "list";
}

export interface PersonDetailPageProps {
  person?: Person;
  directReports?: Person[];
  onBack?: () => void;
}

export interface OrgChartProps {
  rootPerson?: Person;
  people?: Person[];
  onViewPerson?: (personId: string) => void;
}

export interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: Department[];
  teams?: Team[];
  managers?: Person[];
  onCreate?: (person: Partial<Person>) => void;
}
