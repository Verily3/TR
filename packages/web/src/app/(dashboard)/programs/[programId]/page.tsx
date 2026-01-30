"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Edit,
  Users,
  Clock,
  Calendar,
  Loader2,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  MessageSquare,
  Target,
  ClipboardList,
  Upload,
  Users2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentTenant } from "@/stores/auth-store";
import {
  useProgram,
  useProgramEnrollments,
  type ProgramDetails,
  type Module,
  type Lesson,
  type Enrollment,
} from "@/hooks/api";
import { AddParticipantModal } from "@/components/programs/add-participant-modal";

const statusConfig: Record<
  ProgramDetails["status"],
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  active: { label: "Active", color: "text-green-700", bgColor: "bg-green-100" },
  completed: { label: "Completed", color: "text-blue-700", bgColor: "bg-blue-100" },
  archived: { label: "Archived", color: "text-gray-700", bgColor: "bg-gray-100" },
};

const lessonTypeIcons: Record<Lesson["type"], React.ElementType> = {
  reading: FileText,
  video: Video,
  meeting: Users2,
  submission: Upload,
  assignment: ClipboardList,
  assessment: ClipboardList,
  goal: Target,
  reflection: MessageSquare,
};

const lessonTypeLabels: Record<Lesson["type"], string> = {
  reading: "Reading",
  video: "Video",
  meeting: "Live Session",
  submission: "Submission",
  assignment: "Assignment",
  assessment: "Assessment",
  goal: "Goal Setting",
  reflection: "Reflection",
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || null;

  // Modal state
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const { data: program, isLoading, error } = useProgram(tenantId, programId);
  const { data: enrollmentsData } = useProgramEnrollments(tenantId, programId, {
    perPage: 10,
  });

  const enrollments = enrollmentsData?.items || [];

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Program not found</h3>
            <p className="text-muted-foreground mb-4">
              The program you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => router.push("/programs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[program.status];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalLessons = program.modules?.reduce(
    (acc, mod) => acc + (mod.lessons?.length || mod.lessonCount || 0),
    0
  ) || 0;

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/programs")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Programs
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-accent/10 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{program.name}</h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${status.bgColor} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {program.modules?.length || 0} modules
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {totalLessons} lessons
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {enrollmentsData?.meta.total || 0} learners
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddParticipant(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add Participant
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal
        open={showAddParticipant}
        onOpenChange={setShowAddParticipant}
        programId={programId}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Modules */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {program.description && (
            <Card>
              <CardHeader>
                <CardTitle>About this Program</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{program.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                Curriculum
              </CardTitle>
              <CardDescription>
                {program.modules?.length || 0} modules with {totalLessons} lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!program.modules || program.modules.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No modules yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {program.modules.map((module, index) => (
                    <ModuleAccordion
                      key={module.id}
                      module={module}
                      index={index + 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(program.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(program.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program Type</p>
                <p className="font-medium">
                  {program.type === "cohort" ? "Cohort-Based" : "Self-Paced"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Learners Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Learners
              </CardTitle>
              <CardDescription>
                {enrollmentsData?.meta.total || 0} enrolled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No learners yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 5).map((enrollment) => (
                    <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                  ))}
                  {(enrollmentsData?.meta.total || 0) > 5 && (
                    <Button variant="ghost" className="w-full text-accent">
                      View all {enrollmentsData?.meta.total} learners
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ModuleAccordion({ module, index }: { module: Module; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const lessons = module.lessons || [];

  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent text-sm font-medium">
            {index}
          </span>
          <div className="text-left">
            <h4 className="font-medium">{module.title}</h4>
            <p className="text-sm text-muted-foreground">
              {module.lessonCount || lessons.length} lessons
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              module.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {module.status === "published" ? "Published" : "Draft"}
          </span>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && lessons.length > 0 && (
        <div className="border-t px-4 py-2">
          {lessons.map((lesson, lessonIndex) => (
            <LessonRow key={lesson.id} lesson={lesson} index={lessonIndex + 1} />
          ))}
        </div>
      )}

      {isOpen && lessons.length === 0 && (
        <div className="border-t px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No lessons in this module</p>
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const LessonIcon = lessonTypeIcons[lesson.type] || FileText;

  return (
    <div className="flex items-center gap-3 py-3 px-2 hover:bg-muted/30 rounded-lg transition-colors">
      <span className="flex items-center justify-center h-6 w-6 rounded bg-muted text-xs font-medium">
        {index}
      </span>
      <LessonIcon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">
          {lessonTypeLabels[lesson.type]}
          {lesson.durationMinutes && ` · ${lesson.durationMinutes} min`}
          {lesson.points > 0 && ` · ${lesson.points} pts`}
        </p>
      </div>
    </div>
  );
}

function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
  const getInitials = () => {
    const first = enrollment.firstName?.[0] || "";
    const last = enrollment.lastName?.[0] || "";
    return (first + last).toUpperCase() || enrollment.email[0].toUpperCase();
  };

  const getName = () => {
    const name = [enrollment.firstName, enrollment.lastName].filter(Boolean).join(" ");
    return name || enrollment.email;
  };

  const roleConfig: Record<Enrollment["role"], { color: string; label: string }> = {
    facilitator: { color: "bg-purple-100 text-purple-700", label: "Facilitator" },
    mentor: { color: "bg-blue-100 text-blue-700", label: "Mentor" },
    learner: { color: "bg-gray-100 text-gray-700", label: "Learner" },
  };

  const role = roleConfig[enrollment.role] || roleConfig.learner;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={enrollment.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{getName()}</p>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-xs font-medium rounded ${role.color}`}
          >
            {role.label}
          </span>
          <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
        </div>
      </div>
    </div>
  );
}
