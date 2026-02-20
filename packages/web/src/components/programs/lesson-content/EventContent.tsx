'use client';

import { Calendar, Clock, MapPin, Video, ExternalLink } from 'lucide-react';
import { getEmbedUrl, getVideoProvider } from '@/lib/video-utils';
import type { EventConfig } from '@/types/programs';

interface EventContentProps {
  title: string;
  eventConfig: EventConfig;
}

export function EventContent({ title, eventConfig }: EventContentProps) {
  const { date, startTime, endTime, timezone, location, zoomLink, meetingId, meetingPassword, description, videoUrl } = eventConfig;

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const formatTime = (t: string) => {
    try {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
      return t;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold uppercase tracking-wider">
            Program Event
          </div>
        </div>
        <h2 className="text-2xl font-bold text-sidebar-foreground">{title}</h2>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {date && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{formatDate(date)}</p>
              {timezone && <p className="text-xs text-muted-foreground mt-0.5">{timezone}</p>}
            </div>
          </div>
        )}
        {(startTime || endTime) && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">
                {startTime && formatTime(startTime)}
                {startTime && endTime && ' – '}
                {endTime && formatTime(endTime)}
              </p>
              {timezone && <p className="text-xs text-muted-foreground mt-0.5">{timezone}</p>}
            </div>
          </div>
        )}
        {location && (
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{location}</p>
            </div>
          </div>
        )}
        {zoomLink && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Video className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <a
                href={zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Join Meeting <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {meetingId && <p className="text-xs text-muted-foreground mt-1">ID: {meetingId}</p>}
              {meetingPassword && <p className="text-xs text-muted-foreground">Password: {meetingPassword}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div>
          <h3 className="text-base font-semibold text-sidebar-foreground mb-2">Details</h3>
          <div
            className="text-sm text-muted-foreground prose prose-sm max-w-none prose-headings:text-sidebar-foreground prose-p:text-muted-foreground prose-strong:text-sidebar-foreground"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}

      {/* Video */}
      {videoUrl && (() => {
        const embedUrl = getEmbedUrl(videoUrl);
        const provider = getVideoProvider(videoUrl);
        if (embedUrl && provider) {
          return (
            <div>
              <h3 className="text-base font-semibold text-sidebar-foreground mb-3">Event Video</h3>
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Event video"
                  />
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
