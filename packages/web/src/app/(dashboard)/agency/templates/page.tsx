"use client";

import { useState } from "react";
import {
  BookOpen,
  Mail,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const programTemplates = [
  {
    id: "1",
    name: "LeaderShift: Leading through Change",
    type: "cohort",
    modules: 8,
    duration: "12 weeks",
    usedBy: 5,
    lastUpdated: "2024-12-01",
  },
  {
    id: "2",
    name: "Executive Excellence",
    type: "individual",
    modules: 6,
    duration: "8 weeks",
    usedBy: 3,
    lastUpdated: "2024-11-15",
  },
  {
    id: "3",
    name: "New Manager Foundations",
    type: "cohort",
    modules: 5,
    duration: "6 weeks",
    usedBy: 8,
    lastUpdated: "2024-10-20",
  },
];

const emailTemplates = [
  {
    id: "1",
    name: "Program Invitation",
    category: "invitations",
    lastUpdated: "2024-12-10",
  },
  {
    id: "2",
    name: "Task Reminder - Due Tomorrow",
    category: "reminders",
    lastUpdated: "2024-12-05",
  },
  {
    id: "3",
    name: "Task Overdue Notice",
    category: "reminders",
    lastUpdated: "2024-12-05",
  },
  {
    id: "4",
    name: "Coach/Mentor Invitation",
    category: "invitations",
    lastUpdated: "2024-11-28",
  },
  {
    id: "5",
    name: "Program Completion",
    category: "completion",
    lastUpdated: "2024-11-20",
  },
];

const resources = [
  {
    id: "1",
    name: "Leadership Competency Framework",
    type: "PDF",
    size: "2.4 MB",
    usedBy: 12,
  },
  {
    id: "2",
    name: "Goal Setting Worksheet",
    type: "PDF",
    size: "540 KB",
    usedBy: 8,
  },
  {
    id: "3",
    name: "Feedback Best Practices Guide",
    type: "PDF",
    size: "1.8 MB",
    usedBy: 6,
  },
  {
    id: "4",
    name: "Change Management Toolkit",
    type: "ZIP",
    size: "15.2 MB",
    usedBy: 4,
  },
];

type TabType = "programs" | "emails" | "resources";

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("programs");

  const tabs = [
    { id: "programs" as const, label: "Program Templates", icon: BookOpen, count: programTemplates.length },
    { id: "emails" as const, label: "Email Templates", icon: Mail, count: emailTemplates.length },
    { id: "resources" as const, label: "Resource Library", icon: FolderOpen, count: resources.length },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-sidebar-foreground mb-2">Templates</h1>
          <p className="text-muted-foreground">
            Manage global templates and resources for all clients
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Program Templates */}
      {activeTab === "programs" && (
        <div className="grid gap-4">
          {programTemplates.map((template) => (
            <Card key={template.id} className="hover:border-accent/30 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.type === "cohort" ? "Cohort Program" : "Individual Program"} · {template.modules} modules · {template.duration}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used by {template.usedBy} clients · Updated {new Date(template.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Preview</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email Templates */}
      {activeTab === "emails" && (
        <div className="grid gap-4">
          {emailTemplates.map((template) => (
            <Card key={template.id} className="hover:border-accent/30 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {template.category} · Updated {new Date(template.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Preview</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resources */}
      {activeTab === "resources" && (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:border-accent/30 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FolderOpen className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{resource.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.type} · {resource.size} · Used by {resource.usedBy} clients
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Replace</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
