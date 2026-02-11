"use client";

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  User,
  Target,
  Users,
  BookOpen,
  Compass,
  CheckCircle,
  Upload,
  Plus,
  Mail,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import type { OnboardingWizardProps, UserProfile, OnboardingGoal } from "./types";
import {
  defaultOnboardingSteps,
  defaultUserProfile,
  suggestedGoals,
  departments,
  timezones,
  stepIconConfig,
} from "./data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  User,
  Target,
  Users,
  BookOpen,
  Compass,
  CheckCircle,
};

export function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  steps = defaultOnboardingSteps,
  initialStep = 0,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [profile, setProfile] = useState<Partial<UserProfile>>(defaultUserProfile);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleAddEmail = () => {
    if (newEmail && !inviteEmails.includes(newEmail)) {
      setInviteEmails([...inviteEmails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const stepConfig = stepIconConfig[step.type];
  const StepIcon = iconMap[step.icon] || Sparkles;

  const renderStepContent = () => {
    switch (step.type) {
      case "welcome":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-sidebar-foreground mb-3">
              Welcome to Transformation OS
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              We're thrilled to have you! In the next few minutes, we'll help you set up your account and discover what's possible.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Quick setup (~5 min)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Personalized experience
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="py-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center shadow-lg">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange("firstName", e.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={profile.jobTitle}
                  onChange={(e) => handleProfileChange("jobTitle", e.target.value)}
                  placeholder="Product Manager"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                  Department
                </label>
                <select
                  value={profile.department}
                  onChange={(e) => handleProfileChange("department", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select...</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                  Timezone
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => handleProfileChange("timezone", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case "goals":
        return (
          <div className="py-4">
            <p className="text-center text-muted-foreground mb-6">
              Select areas you'd like to develop. You can always change these later.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {suggestedGoals.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-sidebar-foreground">
                        {goal.title}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-accent shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {goal.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              {selectedGoals.length} of 8 selected
            </p>
          </div>
        );

      case "team":
        return (
          <div className="py-4 max-w-lg mx-auto">
            <p className="text-center text-muted-foreground mb-6">
              Invite team members to collaborate with you on the platform.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {inviteEmails.length > 0 && (
              <div className="space-y-2 mb-6">
                {inviteEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-sidebar-foreground">{email}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> You can also find and connect with colleagues who are already on the platform from the People page.
              </p>
            </div>
          </div>
        );

      case "programs":
        return (
          <div className="py-4 max-w-lg mx-auto">
            <p className="text-center text-muted-foreground mb-6">
              Based on your goals, here are some recommended programs:
            </p>

            <div className="space-y-3">
              {[
                {
                  title: "Leadership Fundamentals",
                  description: "Build essential leadership skills",
                  duration: "8 weeks",
                  enrolled: 1234,
                },
                {
                  title: "Effective Communication",
                  description: "Master professional communication",
                  duration: "6 weeks",
                  enrolled: 2156,
                },
                {
                  title: "Strategic Thinking",
                  description: "Develop strategic decision-making",
                  duration: "10 weeks",
                  enrolled: 876,
                },
              ].map((program) => (
                <div
                  key={program.title}
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-sidebar-foreground">
                        {program.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {program.duration} • {program.enrolled.toLocaleString()} enrolled
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              You can explore more programs after completing setup
            </p>
          </div>
        );

      case "tour":
        return (
          <div className="py-4 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Compass className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-medium text-sidebar-foreground mb-3">
              Quick Platform Tour
            </h3>
            <p className="text-muted-foreground mb-6">
              Would you like a guided tour of the key features? It only takes about 3 minutes.
            </p>

            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { title: "Dashboard", desc: "Your personalized home base" },
                { title: "Programs", desc: "Learning and development" },
                { title: "Goals", desc: "Track your objectives" },
                { title: "Coaching", desc: "1:1 mentoring sessions" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-3 bg-muted rounded-lg"
                >
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="py-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-sidebar-foreground mb-3">
              You're All Set!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your account is ready. Start exploring programs, set goals, and begin your transformation journey.
            </p>

            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                <Check className="w-4 h-4" />
                Profile Complete
              </div>
              {selectedGoals.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
                  <Target className="w-4 h-4" />
                  {selectedGoals.length} Goals Selected
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stepConfig.bg}`}>
              <StepIcon className={`w-5 h-5 ${stepConfig.text}`} />
            </div>
            <div>
              <h3 className="font-medium text-sidebar-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          <div>
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sidebar-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step.skipLabel && !isLastStep && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-muted-foreground hover:text-sidebar-foreground transition-colors"
              >
                {step.skipLabel}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {step.actionLabel || "Continue"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
