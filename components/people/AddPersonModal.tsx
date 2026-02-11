"use client";

import { useState } from "react";
import { X, User, Mail, Phone, Building2, Users, MapPin } from "lucide-react";
import type { AddPersonModalProps } from "./types";

export function AddPersonModal({
  isOpen,
  onClose,
  departments = [],
  teams = [],
  managers = [],
  onCreate,
}: AddPersonModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    departmentId: "",
    teamId: "",
    managerId: "",
    location: "",
    startDate: "",
    employmentStatus: "active",
    userRole: "employee",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const department = departments.find((d) => d.id === formData.departmentId);
    onCreate?.({
      ...formData,
      id: `p${Date.now()}`,
      department: department?.name || "",
      team: teams.find((t) => t.id === formData.teamId)?.name,
      managerName: managers.find((m) => m.id === formData.managerId)?.name,
      role: formData.title,
      employmentStatus: formData.employmentStatus as "active" | "on_leave" | "terminated" | "contractor",
      userRole: formData.userRole as "admin" | "manager" | "employee" | "contractor",
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      title: "",
      departmentId: "",
      teamId: "",
      managerId: "",
      location: "",
      startDate: "",
      employmentStatus: "active",
      userRole: "employee",
    });
    onClose();
  };

  const filteredTeams = formData.departmentId
    ? teams.filter((t) => t.departmentId === formData.departmentId)
    : teams;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Add New Person
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@company.com"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="San Francisco, CA"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Department */}
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-4">
                Role & Department
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Software Engineer"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                          teamId: "",
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
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
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Team
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={formData.teamId}
                      onChange={(e) =>
                        setFormData({ ...formData, teamId: e.target.value })
                      }
                      disabled={!formData.departmentId}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none disabled:opacity-50"
                    >
                      <option value="">Select team (optional)</option>
                      {filteredTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Reports To
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) =>
                      setFormData({ ...formData, managerId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
                  >
                    <option value="">Select manager (optional)</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} - {manager.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-4">
                Employment Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Employment Status
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employmentStatus: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="contractor">Contractor</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    User Role
                  </label>
                  <select
                    value={formData.userRole}
                    onChange={(e) =>
                      setFormData({ ...formData, userRole: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            Add Person
          </button>
        </div>
      </div>
    </div>
  );
}
