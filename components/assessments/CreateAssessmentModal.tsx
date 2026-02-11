"use client";

import { useState } from "react";
import { X, Search, ChevronRight, Users, Calendar } from "lucide-react";
import type { CreateAssessmentModalProps, AssessmentTemplate } from "./types";
import { samplePeople } from "./data";

type Step = "template" | "subject" | "raters" | "schedule" | "review";

const steps: { id: Step; label: string }[] = [
  { id: "template", label: "Select Template" },
  { id: "subject", label: "Choose Subject" },
  { id: "raters", label: "Add Raters" },
  { id: "schedule", label: "Set Schedule" },
  { id: "review", label: "Review & Launch" },
];

export function CreateAssessmentModal({
  isOpen,
  onClose,
  templates = [],
  onCreate,
}: CreateAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedRaters, setSelectedRaters] = useState<
    { personId: string; type: string }[]
  >([]);
  const [dueDate, setDueDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleCreate = () => {
    if (selectedTemplate && selectedSubject) {
      onCreate?.({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        subject: samplePeople.find((p) => p.id === selectedSubject),
        dueDate,
        status: "draft",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep("template");
    setSelectedTemplate(null);
    setSelectedSubject(null);
    setSelectedRaters([]);
    setDueDate("");
    setSearchTerm("");
    onClose();
  };

  const filteredPeople = samplePeople.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canProceed = () => {
    switch (currentStep) {
      case "template":
        return selectedTemplate !== null;
      case "subject":
        return selectedSubject !== null;
      case "raters":
        return selectedRaters.length > 0;
      case "schedule":
        return dueDate !== "";
      default:
        return true;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleRater = (personId: string, type: string) => {
    const exists = selectedRaters.find(
      (r) => r.personId === personId && r.type === type
    );
    if (exists) {
      setSelectedRaters(
        selectedRaters.filter(
          (r) => !(r.personId === personId && r.type === type)
        )
      );
    } else {
      setSelectedRaters([...selectedRaters, { personId, type }]);
    }
  };

  const raterTypes = [
    { id: "self", label: "Self" },
    { id: "manager", label: "Manager" },
    { id: "peer", label: "Peer" },
    { id: "direct_report", label: "Direct Report" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Create New Assessment
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? "text-accent"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? "bg-accent text-accent-foreground"
                        : index === currentStepIndex
                          ? "bg-accent/10 text-accent border-2 border-accent"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm hidden md:block">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Template Selection */}
          {currentStep === "template" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Choose a template for this 360 assessment
              </p>
              <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sidebar-foreground">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {template.competencies.length} competencies
                          </span>
                          <span>
                            {template.competencies.reduce(
                              (acc, c) => acc + c.questions.length,
                              0
                            )}{" "}
                            questions
                          </span>
                          <span>
                            Scale: {template.scale.min}-{template.scale.max}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedTemplate?.id === template.id
                            ? "border-accent bg-accent"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedTemplate?.id === template.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Selection */}
          {currentStep === "subject" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Who is this assessment for?
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => setSelectedSubject(person.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                      selectedSubject === person.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sidebar-foreground">
                        {person.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {person.role} • {person.email}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSubject === person.id
                          ? "border-accent bg-accent"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedSubject === person.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raters Selection */}
          {currentStep === "raters" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select raters and assign their relationship type
              </p>
              <div className="flex items-center gap-4 text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">
                  {selectedRaters.length} raters selected
                </span>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-auto">
                {samplePeople
                  .filter((p) => p.id !== selectedSubject)
                  .map((person) => {
                    const personRaters = selectedRaters.filter(
                      (r) => r.personId === person.id
                    );
                    return (
                      <div
                        key={person.id}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium">
                            {getInitials(person.name)}
                          </div>
                          <div>
                            <div className="font-medium text-sidebar-foreground text-sm">
                              {person.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {person.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {raterTypes.map((type) => {
                            const isSelected = personRaters.some(
                              (r) => r.type === type.id
                            );
                            return (
                              <button
                                key={type.id}
                                onClick={() => toggleRater(person.id, type.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isSelected
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Schedule */}
          {currentStep === "schedule" && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Set the deadline for this assessment
              </p>
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sidebar-foreground mb-2">
                  Reminder Schedule
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Initial invitation sent immediately</li>
                  <li>• First reminder: 1 week before due date</li>
                  <li>• Second reminder: 3 days before due date</li>
                  <li>• Final reminder: 1 day before due date</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Review your assessment details before launching
              </p>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-xs uppercase text-muted-foreground mb-2">
                    Template
                  </h4>
                  <p className="font-medium text-sidebar-foreground">
                    {selectedTemplate?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate?.competencies.length} competencies •{" "}
                    {selectedTemplate?.competencies.reduce(
                      (acc, c) => acc + c.questions.length,
                      0
                    )}{" "}
                    questions
                  </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-xs uppercase text-muted-foreground mb-2">
                    Subject
                  </h4>
                  {selectedSubject && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium">
                        {getInitials(
                          samplePeople.find((p) => p.id === selectedSubject)
                            ?.name || ""
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sidebar-foreground">
                          {
                            samplePeople.find((p) => p.id === selectedSubject)
                              ?.name
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {
                            samplePeople.find((p) => p.id === selectedSubject)
                              ?.role
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-xs uppercase text-muted-foreground mb-2">
                    Raters ({selectedRaters.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {raterTypes.map((type) => {
                      const count = selectedRaters.filter(
                        (r) => r.type === type.id
                      ).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={type.id}
                          className="px-2 py-1 bg-muted rounded text-sm text-muted-foreground"
                        >
                          {type.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-xs uppercase text-muted-foreground mb-2">
                    Schedule
                  </h4>
                  <p className="font-medium text-sidebar-foreground">
                    Due:{" "}
                    {dueDate
                      ? new Date(dueDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
            className="px-4 py-2 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={currentStep === "review" ? handleCreate : handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === "review" ? "Launch Assessment" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
