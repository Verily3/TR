'use client';

import { memo } from 'react';
import { Play, Video } from 'lucide-react';

import type { LessonContent } from '@/types/programs';
import { getEmbedUrl } from '@/lib/video-utils';
import { isHtmlContent } from '@/lib/html-utils';

interface VideoContentProps {
  content: LessonContent;
  durationMinutes?: number;
}

/**
 * Video lesson content component.
 * Renders a video player (iframe embed or placeholder) and optional key concept segments.
 */
export const VideoContent = memo(function VideoContent({
  content,
  durationMinutes,
}: VideoContentProps) {
  const embedUrl = getEmbedUrl(content.videoUrl || '');
  const hasRealVideo = !!embedUrl;

  const overviewText =
    content.mainContent ||
    content.introduction ||
    'Watch the video above to learn about the key concepts covered in this lesson.';

  return (
    <div>
      {/* Video Player */}
      {hasRealVideo ? (
        <div className="aspect-video rounded-xl mb-6 overflow-hidden border border-border/50">
          <iframe
            src={embedUrl!}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Lesson video"
          />
        </div>
      ) : (
        <div
          className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-6 flex items-center justify-center border border-border/50"
        >
          <div className="text-center">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
              aria-hidden="true"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-accent ml-1" />
            </div>
            <p className="text-muted-foreground font-medium">No Video Available</p>
            {durationMinutes && (
              <p className="text-sm text-muted-foreground">{durationMinutes} min</p>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">Video Overview</h3>
      {isHtmlContent(overviewText) ? (
        <div
          className="mb-6 text-sm sm:text-base prose prose-sm prose-slate max-w-none prose-headings:text-sidebar-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-accent prose-strong:text-sidebar-foreground"
          dangerouslySetInnerHTML={{ __html: overviewText }}
        />
      ) : (
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          {overviewText}
        </p>
      )}

      {/* Key Concept Segments */}
      {content.keyConcepts && content.keyConcepts.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          role="list"
          aria-label="Video segments"
        >
          {content.keyConcepts.map((concept, index) => (
            <button
              key={index}
              className="p-4 bg-card border border-border rounded-xl hover:border-accent/30 hover:shadow-md transition-all cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              role="listitem"
              aria-label={concept.title}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors"
                  aria-hidden="true"
                >
                  <Video className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-sidebar-foreground">{concept.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{concept.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default VideoContent;
