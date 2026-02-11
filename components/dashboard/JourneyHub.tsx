"use client";

import { PlayCircle, Target, FileText, TrendingUp, ArrowRight } from "lucide-react";

interface JourneyBlock {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  action: string;
  onClick?: () => void;
}

const defaultBlocks: JourneyBlock[] = [
  {
    id: "1",
    title: "LeaderShift: Module 3 - Leading Yourself",
    description: "5 of 7 tasks complete • 1,200 points earned",
    icon: PlayCircle,
    progress: 71,
    action: "Continue Module",
  },
  {
    id: "2",
    title: "Submit Module 3 Goal",
    description: "Due tomorrow • Worth 1,000 points",
    icon: Target,
    action: "Enter Goal",
  },
  {
    id: "3",
    title: "Mentor Meeting Scheduled",
    description: "Thursday 2pm with Sarah Chen",
    icon: FileText,
    action: "View Details",
  },
  {
    id: "4",
    title: "2 Team KPIs Need Update",
    description: "Weekly review due Friday",
    icon: TrendingUp,
    action: "Update KPIs",
  },
];

interface JourneyHubProps {
  blocks?: JourneyBlock[];
}

export function JourneyHub({ blocks = defaultBlocks }: JourneyHubProps) {
  return (
    <div className="mb-6 lg:mb-8">
      {/* Section Header */}
      <div className="mb-4 lg:mb-6">
        <h2 className="text-lg sm:text-xl text-sidebar-foreground">Journey Hub</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Your next actions to accelerate progress
        </p>
      </div>

      {/* Journey Blocks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              onClick={block.onClick}
              className="bg-card border border-border rounded-lg p-4 sm:p-5 hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Icon */}
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm mb-1 truncate">{block.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">{block.description}</p>

                  {/* Progress Bar (if applicable) */}
                  {block.progress !== undefined && (
                    <div className="mb-3 sm:mb-4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${block.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {block.progress}% complete
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    {block.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
