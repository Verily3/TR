"use client";

import { useState } from "react";
import {
  Plus,
  GripVertical,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  BookOpen,
  Play,
  Users,
  FileText,
  ClipboardList,
  Target,
  X,
  Sparkles,
} from "lucide-react";
import type { BuilderModule, BuilderLesson, LessonContent, KeyConcept } from "./types";
import { defaultModules, sampleLessonContent } from "./data";

const lessonTypeIcons: Record<BuilderLesson["type"], React.ElementType> = {
  reading: BookOpen,
  video: Play,
  meeting: Users,
  submission: FileText,
  assignment: ClipboardList,
  goal: Target,
};

const lessonTypeLabels: Record<BuilderLesson["type"], string> = {
  reading: "Reading Material",
  video: "Video",
  meeting: "Meeting",
  submission: "Submission",
  assignment: "Assignment",
  goal: "Goal",
};

export function CurriculumTab() {
  const [modules, setModules] = useState<BuilderModule[]>(defaultModules);
  const [selectedLesson, setSelectedLesson] = useState<BuilderLesson | null>(
    defaultModules[0]?.lessons[0] || null
  );
  const [lessonContent, setLessonContent] = useState<LessonContent>(sampleLessonContent);
  const [contentMode, setContentMode] = useState<"shared" | "role-specific">("shared");

  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, expanded: !m.expanded } : m
      )
    );
  };

  const selectLesson = (lesson: BuilderLesson) => {
    setSelectedLesson(lesson);
  };

  const addKeyConcept = () => {
    const newConcept: KeyConcept = {
      id: `kc-${Date.now()}`,
      title: "",
      description: "",
    };
    setLessonContent((prev) => ({
      ...prev,
      keyConcepts: [...prev.keyConcepts, newConcept],
    }));
  };

  const removeKeyConcept = (id: string) => {
    setLessonContent((prev) => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter((kc) => kc.id !== id),
    }));
  };

  const updateKeyConcept = (id: string, field: "title" | "description", value: string) => {
    setLessonContent((prev) => ({
      ...prev,
      keyConcepts: prev.keyConcepts.map((kc) =>
        kc.id === id ? { ...kc, [field]: value } : kc
      ),
    }));
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] overflow-hidden">
      {/* Left Panel: Module Tree (40%) */}
      <div className="w-2/5 border-r border-border p-6 overflow-y-auto">
        {/* Add Module Button */}
        <button className="w-full mb-4 px-4 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add Module
        </button>

        {/* Module List */}
        <div className="space-y-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              {/* Module Header */}
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                <button
                  onClick={() => toggleModule(module.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {module.expanded ? (
                    <ChevronDown className="w-4 h-4 text-sidebar-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {module.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {module.lessonCount} lessons
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Expanded Lesson List */}
              {module.expanded && (
                <>
                  <div className="ml-6 mt-3 space-y-2">
                    {module.lessons.map((lesson) => {
                      const Icon = lessonTypeIcons[lesson.type];
                      const isSelected = selectedLesson?.id === lesson.id;
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-accent/10 border-accent"
                              : "bg-muted/30 border-border hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-sidebar-foreground" />
                          <div className="flex-1">
                            <div className="text-sm text-sidebar-foreground">
                              {lesson.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                {lesson.duration}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  lesson.status === "published"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {lesson.status === "published" ? "Published" : "Draft"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Lesson Button */}
                  <button className="ml-6 mt-2 text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add Lesson
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Lesson Editor (60%) */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedLesson ? (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-border mb-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = lessonTypeIcons[selectedLesson.type];
                  return <Icon className="w-5 h-5 text-sidebar-foreground" />;
                })()}
                <div>
                  <div className="text-sidebar-foreground font-medium">
                    {selectedLesson.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lessonTypeLabels[selectedLesson.type]}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedLesson.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedLesson.status === "published" ? "Published" : "Draft"}
                </span>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-sidebar-foreground" />
                </button>
              </div>
            </div>

            {/* Content Mode Selector */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setContentMode("shared")}
                className={`flex-1 px-4 py-3 border-2 rounded-lg text-sm font-medium text-sidebar-foreground transition-colors ${
                  contentMode === "shared"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                Shared Content
                <div className="text-xs text-muted-foreground mt-0.5">
                  Same for all roles
                </div>
              </button>
              <button
                onClick={() => setContentMode("role-specific")}
                className={`flex-1 px-4 py-3 border-2 rounded-lg text-sm font-medium text-sidebar-foreground transition-colors ${
                  contentMode === "role-specific"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                Role-Specific Content
                <div className="text-xs text-muted-foreground mt-0.5">
                  Different per role
                </div>
              </button>
            </div>

            {/* Content Fields */}
            <div className="space-y-4">
              {/* Introduction */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Introduction
                </label>
                <textarea
                  rows={4}
                  value={lessonContent.introduction}
                  onChange={(e) =>
                    setLessonContent((prev) => ({
                      ...prev,
                      introduction: e.target.value,
                    }))
                  }
                  placeholder="Provide context and preview what learners will explore..."
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Main Content */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Main Content
                </label>
                <textarea
                  rows={8}
                  value={lessonContent.mainContent}
                  onChange={(e) =>
                    setLessonContent((prev) => ({
                      ...prev,
                      mainContent: e.target.value,
                    }))
                  }
                  placeholder="Main learning content..."
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Key Concepts */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Key Concepts
                </label>

                {lessonContent.keyConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="border border-border rounded-lg p-4 mb-3"
                  >
                    <input
                      type="text"
                      value={concept.title}
                      onChange={(e) =>
                        updateKeyConcept(concept.id, "title", e.target.value)
                      }
                      placeholder="Concept title"
                      className="w-full mb-2 px-3 py-2 bg-input border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <textarea
                      rows={2}
                      value={concept.description}
                      onChange={(e) =>
                        updateKeyConcept(concept.id, "description", e.target.value)
                      }
                      placeholder="Concept description"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                    <button
                      onClick={() => removeKeyConcept(concept.id)}
                      className="mt-2 text-sm text-accent hover:text-accent/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={addKeyConcept}
                  className="text-sm text-accent hover:text-accent/80 font-medium"
                >
                  + Add Key Concept
                </button>
              </div>

              {/* Key Takeaway */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Key Takeaway
                </label>
                <textarea
                  rows={3}
                  value={lessonContent.keyTakeaway}
                  onChange={(e) =>
                    setLessonContent((prev) => ({
                      ...prev,
                      keyTakeaway: e.target.value,
                    }))
                  }
                  placeholder="The one thing learners should remember..."
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Visibility Settings */}
              <div className="border-t border-border pt-4 mt-6">
                <label className="block text-sm font-medium text-sidebar-foreground mb-3">
                  Visibility
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonContent.visibleToLearners}
                      onChange={(e) =>
                        setLessonContent((prev) => ({
                          ...prev,
                          visibleToLearners: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-sm text-sidebar-foreground">
                      Visible to Learners
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonContent.visibleToMentors}
                      onChange={(e) =>
                        setLessonContent((prev) => ({
                          ...prev,
                          visibleToMentors: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-sm text-sidebar-foreground">
                      Visible to Mentors
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonContent.visibleToFacilitators}
                      onChange={(e) =>
                        setLessonContent((prev) => ({
                          ...prev,
                          visibleToFacilitators: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-sm text-sidebar-foreground">
                      Visible to Facilitators
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Save Draft
                </button>
                <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                  Save & Close
                </button>
              </div>
            </div>
          </>
        ) : (
          /* AI Assistant Panel when no lesson is selected */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-sidebar-foreground mb-2">
                AI Curriculum Assistant
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a lesson from the left panel to edit its content, or use
                AI to help generate engaging learning materials.
              </p>
              <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                Generate Content Suggestions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
