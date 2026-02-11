'use client';

import { Video, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardUpcomingItem } from '@/hooks/api/useLearnerDashboard';

interface MyScheduleProps {
  meetings?: DashboardUpcomingItem[];
}

export function MySchedule({ meetings = [] }: MyScheduleProps) {
  const router = useRouter();

  return (
    <div className="h-full bg-card border border-border rounded-xl p-5 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-sidebar-foreground">My Schedule</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Upcoming sessions
          </p>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {meetings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            </div>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={`${meeting.lessonId}-${meeting.programId}`}
              onClick={() => router.push(`/programs/${meeting.programId}/learn`)}
              className="border border-border rounded-lg p-3 flex items-center gap-3 hover:border-accent/30 transition-all cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-muted shrink-0">
                <Video className="w-4 h-4 text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-sidebar-foreground truncate mb-0.5">
                  {meeting.lessonTitle}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="truncate">{meeting.programName}</span>
                  {meeting.durationMinutes && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {meeting.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
