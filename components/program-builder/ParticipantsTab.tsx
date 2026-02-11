"use client";

import { useState } from "react";
import { Users, Users2, Search, Upload, MoreVertical } from "lucide-react";
import type { Participant, ParticipantRole, ParticipantStatus } from "./types";
import { defaultParticipants, defaultParticipantStats } from "./data";

const roleColors: Record<ParticipantRole, { bg: string; text: string }> = {
  learner: { bg: "bg-blue-100", text: "text-blue-700" },
  mentor: { bg: "bg-green-100", text: "text-green-700" },
  facilitator: { bg: "bg-purple-100", text: "text-purple-700" },
};

const statusColors: Record<ParticipantStatus, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  inactive: { bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { bg: "bg-blue-100", text: "text-blue-700" },
};

export function ParticipantsTab() {
  const [participants] = useState<Participant[]>(defaultParticipants);
  const [stats] = useState(defaultParticipantStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<ParticipantRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredParticipants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParticipants.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Total Enrolled */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-2xl font-medium text-sidebar-foreground">
                {stats.totalEnrolled}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Total Enrolled</div>
          </div>

          {/* Active Learners */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">
                {stats.activeLearners}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Active Learners</div>
          </div>

          {/* Assigned Mentors */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">
                {stats.assignedMentors}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Assigned Mentors</div>
          </div>

          {/* Facilitators */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users2 className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-medium text-sidebar-foreground">
                {stats.facilitators}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Facilitators</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          {/* Search */}
          <div className="relative w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center gap-3">
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as ParticipantRole | "all")}
              className="px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Roles</option>
              <option value="learner">Learner</option>
              <option value="mentor">Mentor</option>
              <option value="facilitator">Facilitator</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ParticipantStatus | "all")
              }
              className="px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>

            {/* Import button */}
            <button className="px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Participants
            </button>

            {/* Assign Roles button */}
            <button className="px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Users2 className="w-4 h-4" />
              Assign Roles
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            {/* Table header */}
            <thead>
              <tr className="bg-muted">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredParticipants.length &&
                      filteredParticipants.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr
                  key={participant.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(participant.id)}
                      onChange={() => toggleSelect(participant.id)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
                          {getInitials(participant.name)}
                        </div>
                      )}
                      <span className="text-sm text-sidebar-foreground">
                        {participant.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {participant.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roleColors[participant.role].bg
                      } ${roleColors[participant.role].text}`}
                    >
                      {participant.role.charAt(0).toUpperCase() +
                        participant.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[participant.status].bg
                      } ${statusColors[participant.status].text}`}
                    >
                      {participant.status.charAt(0).toUpperCase() +
                        participant.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${participant.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {participant.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-muted-foreground">
                      No participants found matching your filters
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredParticipants.length} of {participants.length} participants
        </div>
      </div>
    </div>
  );
}
