"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  BookOpen,
  ClipboardList,
  Target,
  Eye,
  Copy,
  Edit,
  MoreHorizontal,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card } from "../ui";
import type { TemplatesTabProps } from "./types";
import { defaultTemplates, templateTypeConfig } from "./data";

type FilterType = "all" | "program" | "assessment" | "goal";

export function TemplatesTab({
  templates = defaultTemplates,
  onViewTemplate,
  onCreateTemplate,
}: TemplatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  const filteredTemplates = templates
    .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
    .filter((t) =>
      publishedFilter === "all"
        ? true
        : publishedFilter === "published"
          ? t.isPublished
          : !t.isPublished
    )
    .filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "program":
        return <BookOpen className="w-5 h-5" />;
      case "assessment":
        return <ClipboardList className="w-5 h-5" />;
      case "goal":
        return <Target className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Template Library
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage reusable templates for programs, assessments, and goals
          </p>
        </div>
        <button
          onClick={onCreateTemplate}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {templates.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Templates</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {templates.filter((t) => t.type === "program").length}
              </div>
              <div className="text-sm text-muted-foreground">Programs</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {templates.filter((t) => t.type === "assessment").length}
              </div>
              <div className="text-sm text-muted-foreground">Assessments</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {templates.filter((t) => t.type === "goal").length}
              </div>
              <div className="text-sm text-muted-foreground">Goals</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Types</option>
            <option value="program">Programs</option>
            <option value="assessment">Assessments</option>
            <option value="goal">Goals</option>
          </select>

          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const typeConf = templateTypeConfig[template.type];
          return (
            <Card
              key={template.id}
              padding="lg"
              className="hover:border-accent/30 transition-colors cursor-pointer"
              onClick={() => onViewTemplate?.(template.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeConf.bg}`}>
                    {getTypeIcon(template.type)}
                  </div>
                  <div>
                    <div className="font-medium text-sidebar-foreground">
                      {template.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.bg} ${typeConf.text}`}
                      >
                        {typeConf.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {template.isPublished ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                      <Clock className="w-3 h-3" />
                      Draft
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Used {template.usageCount} times</span>
                  <span>Updated {formatDate(template.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTemplate?.(template.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">No Templates Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || typeFilter !== "all" || publishedFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first template to get started"}
            </p>
            <button
              onClick={onCreateTemplate}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Create Template
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
