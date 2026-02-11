"use client";

import { useState } from "react";
import { X, Calendar, Clock, Video, MapPin } from "lucide-react";
import type { NewSessionModalProps, SessionType } from "./types";
import { sessionTypeLabels, relationshipTypeLabels } from "./data";

const sessionTypes: SessionType[] = ["coaching", "one_on_one", "check_in", "review", "planning"];

const durations = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
];

export function NewSessionModal({
  isOpen,
  onClose,
  relationships = [],
  onCreate,
}: NewSessionModalProps) {
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("coaching");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [agenda, setAgenda] = useState("");
  const [locationType, setLocationType] = useState<"in_person" | "video">("video");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const relationship = relationships.find((r) => r.id === selectedRelationship);
    if (!relationship || !date || !time) return;

    onCreate?.({
      relationshipId: selectedRelationship,
      coach: relationship.coach,
      coachee: relationship.coachee,
      type: sessionType,
      status: "scheduled",
      scheduledAt: `${date}T${time}:00Z`,
      duration,
      location: locationType === "in_person" ? location : undefined,
      videoLink: locationType === "video" ? videoLink : undefined,
      agenda,
      notes: [],
      actionItems: [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl mx-4 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Schedule New Session
            </h2>
            <p className="text-sm text-muted-foreground">
              Set up a coaching or mentoring session
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Relationship Selection */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Coaching Relationship <span className="text-accent">*</span>
            </label>
            <select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a relationship...</option>
              {relationships.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.coach.name} → {rel.coachee.name} ({relationshipTypeLabels[rel.type]})
                </option>
              ))}
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Session Type <span className="text-accent">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sessionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                    sessionType === type
                      ? "border-accent bg-accent/5 text-sidebar-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {sessionTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Date <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Time <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    duration === d.value
                      ? "border-accent bg-accent/5 text-sidebar-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Meeting Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLocationType("video")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === "video"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <Video className="w-5 h-5 text-accent mb-2" />
                <div className="font-medium text-sidebar-foreground text-sm">Video Call</div>
                <div className="text-xs text-muted-foreground">Meet online</div>
              </button>
              <button
                type="button"
                onClick={() => setLocationType("in_person")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  locationType === "in_person"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <MapPin className="w-5 h-5 text-accent mb-2" />
                <div className="font-medium text-sidebar-foreground text-sm">In Person</div>
                <div className="text-xs text-muted-foreground">Meet in office</div>
              </button>
            </div>
          </div>

          {/* Location or Video Link */}
          {locationType === "video" ? (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Video Link
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Conference Room A"
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Agenda (optional)
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Topics to discuss in this session..."
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRelationship || !date || !time}
            className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}
