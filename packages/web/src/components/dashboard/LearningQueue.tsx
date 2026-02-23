'use client';

import { Video, BookOpen, FileText, ArrowRight, Lightbulb } from 'lucide-react';

interface LearningItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'template';
  duration?: string;
  description: string;
  linkedTo: string;
  action: string;
}

const defaultItems: LearningItem[] = [
  {
    id: '1',
    title: 'Communicating Vision Under Pressure',
    type: 'video',
    duration: '12 min',
    description: 'Recommended based on your Team Engagement KPI',
    linkedTo: 'Team Engagement Score',
    action: 'Start Learning',
  },
  {
    id: '2',
    title: 'The Science of Goal Achievement',
    type: 'article',
    duration: '8 min read',
    description: 'Align with your Q1 strategic objectives',
    linkedTo: 'Goal Achievement',
    action: 'Start Learning',
  },
  {
    id: '3',
    title: '1:1 Coaching Conversation Framework',
    type: 'template',
    description: 'Prepare for your upcoming coaching session',
    linkedTo: '1:1 Completion Rate',
    action: 'Download',
  },
];

const iconMap = {
  video: Video,
  article: BookOpen,
  template: FileText,
};

interface LearningQueueProps {
  items?: LearningItem[];
  isLoading?: boolean;
}

export function LearningQueue({ items, isLoading }: LearningQueueProps) {
  const displayItems = items ?? defaultItems;
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl text-sidebar-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Learning Queue
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Personalized content to accelerate your growth
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border border-border rounded-xl">
          You&apos;re all caught up! No pending items.
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => {
            const Icon = iconMap[item.type];
            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm text-sidebar-foreground">{item.title}</h4>
                      {item.duration && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {item.duration}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-xs mb-2">
                      Linked to: {item.linkedTo}
                    </div>

                    <button className="text-xs text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                      {item.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
