import { ChevronLeft, BookOpen, Target, Calendar, Award, Play } from "lucide-react";
import { LeaderShiftTracker } from "@/app/components/programs/LeaderShiftTracker";

interface ProgramDetailPageProps {
  programId: string;
  onBack: () => void;
  onStartModule: () => void;
}

export function ProgramDetailPage({ programId, onBack, onStartModule }: ProgramDetailPageProps) {
  // In a real app, would fetch program details by ID
  // For now, hardcoded for LeaderShift

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Programs
        </button>

        {/* Program Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-sidebar-foreground mb-1">LeaderShift</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Leadership Track</span>
                    <span>•</span>
                    <span>9 Modules</span>
                    <span>•</span>
                    <span>~12 weeks</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-3xl">
                A comprehensive leadership development program designed to transform managers into high-impact leaders.
                Master essential leadership competencies through structured modules, mentor coaching, and practical
                application.
              </p>
            </div>

            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
              IN PROGRESS
            </div>
          </div>
        </div>

        {/* Program Stats */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">TOTAL POINTS</span>
            </div>
            <div className="text-2xl text-sidebar-foreground">11,800</div>
            <div className="text-xs text-muted-foreground mt-1">of 57,000 available</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">PROGRESS</span>
            </div>
            <div className="text-2xl text-sidebar-foreground">27%</div>
            <div className="text-xs text-muted-foreground mt-1">2.4 of 9 modules complete</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">TIME REMAINING</span>
            </div>
            <div className="text-2xl text-sidebar-foreground">9 weeks</div>
            <div className="text-xs text-muted-foreground mt-1">Due April 15, 2026</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">LINKED GOALS</span>
            </div>
            <div className="text-2xl text-sidebar-foreground">2</div>
            <div className="text-xs text-muted-foreground mt-1">Active connections</div>
          </div>
        </div>

        {/* Module Progress Tracker */}
        <LeaderShiftTracker onContinue={onStartModule} />

        {/* Program Overview */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* What You'll Learn */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sidebar-foreground mb-4">What You'll Learn</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Distinguish between leadership and management responsibilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Develop self-awareness and emotional intelligence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Master performance planning and coaching frameworks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Build high-performing, accountable teams</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Navigate difficult conversations and corrective action</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>Develop strategic leadership thinking</span>
              </li>
            </ul>
          </div>

          {/* Program Structure */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sidebar-foreground mb-4">Program Structure</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-sidebar-foreground mb-2">Each module includes:</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Reading materials (20-30 min)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Video content (25-30 min)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Mentor coaching session (60 min)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Reflection submissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Practical assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>Goal setting exercise</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">ESTIMATED TIME COMMITMENT</div>
                <div className="text-sm text-sidebar-foreground">3-4 hours per module</div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Goals */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sidebar-foreground mb-4">Linked Goals</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-sm text-sidebar-foreground">Improve Team Engagement Score</div>
                  <div className="text-xs text-muted-foreground">Q1 2026 • Individual Goal</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-sidebar-foreground">72%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <button className="text-sm text-accent hover:text-accent/80">View Goal</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-sm text-sidebar-foreground">Develop Coaching Capability</div>
                  <div className="text-xs text-muted-foreground">H1 2026 • Development Goal</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-sidebar-foreground">45%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <button className="text-sm text-accent hover:text-accent/80">View Goal</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
