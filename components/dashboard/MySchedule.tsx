"use client";

import { Video, Users, Calendar, Clock } from "lucide-react";

interface ScheduleItem {
  id: string;
  title: string;
  type: "coaching" | "group";
  date: string;
  duration: string;
  participants?: number;
  onJoin?: () => void;
}

const defaultItems: ScheduleItem[] = [
  {
    id: "1",
    title: "1:1 Coaching Session",
    type: "coaching",
    date: "Today, 2:00 PM",
    duration: "45 min",
  },
  {
    id: "2",
    title: "Leadership Cohort Call",
    type: "group",
    date: "Tomorrow, 10:00 AM",
    duration: "60 min",
    participants: 12,
  },
  {
    id: "3",
    title: "Check-in with Coach Sarah",
    type: "coaching",
    date: "Jan 17, 3:30 PM",
    duration: "30 min",
  },
];

interface MyScheduleProps {
  items?: ScheduleItem[];
  onViewCalendar?: () => void;
}

export function MySchedule({ items = defaultItems, onViewCalendar }: MyScheduleProps) {
  return (
    <div>
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sidebar-foreground">My Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upcoming coaching and group sessions
          </p>
        </div>
        <button
          onClick={onViewCalendar}
          className="text-sm text-accent hover:underline"
        >
          View Calendar
        </button>
      </div>

      {/* Schedule Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-all"
          >
            <div className="p-2 rounded-lg bg-muted">
              {item.type === "coaching" ? (
                <Video className="w-5 h-5 text-accent" />
              ) : (
                <Users className="w-5 h-5 text-accent" />
              )}
            </div>

            <div className="flex-1">
              <h4 className="text-sm mb-1">{item.title}</h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.duration}
                </span>
                {item.participants && <span>{item.participants} participants</span>}
              </div>
            </div>

            <button
              onClick={item.onJoin}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
