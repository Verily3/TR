"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card } from "../ui";
import { PersonCard } from "./PersonCard";
import { AddPersonModal } from "./AddPersonModal";
import type { PeoplePageProps, EmploymentStatus } from "./types";
import {
  defaultPeople,
  defaultDepartments,
  defaultTeams,
  defaultPeopleStats,
} from "./data";

type ViewMode = "grid" | "list";
type FilterStatus = "all" | EmploymentStatus;

const filterOptions: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All People" },
  { id: "active", label: "Active" },
  { id: "on_leave", label: "On Leave" },
  { id: "contractor", label: "Contractors" },
];

export function PeoplePage({
  people = defaultPeople,
  departments = defaultDepartments,
  teams = defaultTeams,
  stats = defaultPeopleStats,
  onViewPerson,
}: PeoplePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPeople = people
    .filter((p) =>
      activeFilter === "all" ? true : p.employmentStatus === activeFilter
    )
    .filter((p) =>
      selectedDepartment === "all" ? true : p.departmentId === selectedDepartment
    )
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const managers = people.filter(
    (p) => p.userRole === "admin" || p.userRole === "manager"
  );

  return (
    <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground mb-1 sm:mb-2">
            People
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your team members, view org structure, and track roles
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Person
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.totalPeople}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total People</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.activeEmployees}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Active Employees</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.departments}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Departments</div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              {stats.teams}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Teams</div>
        </Card>

        <Card padding="sm" className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <span className="text-xl sm:text-2xl font-medium text-sidebar-foreground">
              +{stats.newThisMonth}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">New This Month</div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Status Filter - Scrollable on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 bg-muted rounded-lg overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveFilter(option.id)}
                className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeFilter === option.id
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-background"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-auto"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full lg:w-64 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-background"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-background"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs sm:text-sm text-muted-foreground mb-4">
        Showing {filteredPeople.length} of {people.length} people
      </div>

      {/* People List/Grid */}
      {filteredPeople.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onView={onViewPerson}
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
                onView={onViewPerson}
                variant="list"
              />
            ))}
          </div>
        )
      ) : (
        <Card padding="lg">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">No People Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search or filters"
                : "Add your first team member to get started"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
              >
                Add Person
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        departments={departments}
        teams={teams}
        managers={managers}
      />
    </main>
  );
}
