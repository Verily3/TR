"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Users,
  Edit,
  MoreHorizontal,
  Briefcase,
  Award,
  MessageSquare,
} from "lucide-react";
import { Card } from "../ui";
import type { PersonDetailPageProps } from "./types";
import { defaultPeople, employmentStatusConfig, userRoleConfig } from "./data";

type Tab = "overview" | "activity" | "goals" | "feedback";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Briefcase className="w-4 h-4" /> },
  { id: "activity", label: "Activity", icon: <Calendar className="w-4 h-4" /> },
  { id: "goals", label: "Goals", icon: <Award className="w-4 h-4" /> },
  { id: "feedback", label: "Feedback", icon: <MessageSquare className="w-4 h-4" /> },
];

export function PersonDetailPage({
  person = defaultPeople[0],
  directReports = defaultPeople.filter((p) => p.managerId === defaultPeople[0].id),
  onBack,
}: PersonDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const statusConfig = employmentStatusConfig[person.employmentStatus];
  const roleConfig = userRoleConfig[person.userRole];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateTenure = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const years = Math.floor(
      (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const months = Math.floor(
      ((now.getTime() - start.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) /
        (30.44 * 24 * 60 * 60 * 1000)
    );
    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""}${months > 0 ? `, ${months} month${months > 1 ? "s" : ""}` : ""}`;
    }
    return `${months} month${months > 1 ? "s" : ""}`;
  };

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-sidebar-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to People
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-accent/10 text-accent flex items-center justify-center text-3xl font-medium">
              {getInitials(person.name)}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-sidebar-foreground">
                  {person.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${roleConfig.bg} ${roleConfig.text}`}
                >
                  {roleConfig.label}
                </span>
              </div>
              <p className="text-lg text-muted-foreground mb-2">{person.title}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button className="p-2 border border-border text-sidebar-foreground rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-background"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Contact Info */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <a
                    href={`mailto:${person.email}`}
                    className="text-accent hover:underline"
                  >
                    {person.email}
                  </a>
                </div>
              </div>
              {person.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <span className="text-sidebar-foreground">{person.phone}</span>
                  </div>
                </div>
              )}
              {person.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <span className="text-sidebar-foreground">{person.location}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Employment Info */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Employment Details
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Start Date</div>
                <span className="text-sidebar-foreground">
                  {formatDate(person.startDate)}
                </span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tenure</div>
                <span className="text-sidebar-foreground">
                  {calculateTenure(person.startDate)}
                </span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <span className="text-sidebar-foreground">{person.department}</span>
              </div>
              {person.team && (
                <div>
                  <div className="text-sm text-muted-foreground">Team</div>
                  <span className="text-sidebar-foreground">{person.team}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reporting Structure */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Reporting Structure
            </h3>
            <div className="space-y-4">
              {person.managerName && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Reports To
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
                      {getInitials(person.managerName)}
                    </div>
                    <div>
                      <div className="font-medium text-sidebar-foreground">
                        {person.managerName}
                      </div>
                      <div className="text-sm text-muted-foreground">Manager</div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Direct Reports
                </div>
                <span className="text-2xl font-bold text-sidebar-foreground">
                  {person.directReports || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Bio */}
          {person.bio && (
            <Card padding="lg" className="col-span-2">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                About
              </h3>
              <p className="text-muted-foreground">{person.bio}</p>
            </Card>
          )}

          {/* Skills */}
          {person.skills && person.skills.length > 0 && (
            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {person.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Direct Reports List */}
          {directReports.length > 0 && (
            <Card padding="lg" className="col-span-3">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Direct Reports ({directReports.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {directReports.map((report) => {
                  const reportStatus = employmentStatusConfig[report.employmentStatus];
                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-accent/30 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
                        {getInitials(report.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sidebar-foreground">
                            {report.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${reportStatus.bg} ${reportStatus.text}`}
                          >
                            {reportStatus.label}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {report.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <Card padding="lg">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">Activity Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Activity history and recent actions will appear here
            </p>
          </div>
        </Card>
      )}

      {activeTab === "goals" && (
        <Card padding="lg">
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">Goals & Objectives</h3>
            <p className="text-sm text-muted-foreground">
              Individual goals and progress tracking will appear here
            </p>
          </div>
        </Card>
      )}

      {activeTab === "feedback" && (
        <Card padding="lg">
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">Feedback History</h3>
            <p className="text-sm text-muted-foreground">
              360 feedback and performance reviews will appear here
            </p>
          </div>
        </Card>
      )}
    </main>
  );
}
