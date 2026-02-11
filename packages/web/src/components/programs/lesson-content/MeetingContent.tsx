'use client';

import { memo } from 'react';
import { Users } from 'lucide-react';
import type { LessonContent, EnrollmentRole } from '@/types/programs';
import { isHtmlContent } from '@/lib/html-utils';

interface MeetingContentProps {
  content: LessonContent;
  mentorNames?: string[];
  enrollmentRole?: EnrollmentRole;
}

/**
 * Meeting lesson content component.
 * Displays mentor/mentee meeting information, preparation instructions,
 * discussion topics, and scheduling action based on enrollment role.
 */
export const MeetingContent = memo(function MeetingContent({
  content,
  mentorNames = [],
  enrollmentRole = 'learner',
}: MeetingContentProps) {
  const agenda =
    content.agenda ||
    'Schedule a meeting with your assigned mentor to discuss this module\'s concepts and how they apply to your specific leadership challenges.';

  const discussionQuestions = content.discussionQuestions ?? [];
  const preparationInstructions = content.preparationInstructions;

  const isLearner = enrollmentRole === 'learner';

  const displayName = mentorNames.length > 0 ? mentorNames[0] : 'Your assigned mentor';

  const roleLabel = isLearner ? 'Your Mentor' : 'Your Mentee';
  const roleDescription = isLearner
    ? displayName
    : 'Your assigned mentee';

  return (
    <div>
      {/* Introduction */}
      {content.introduction && (
        isHtmlContent(content.introduction) ? (
          <div className="text-muted-foreground mb-6 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: content.introduction }} />
        ) : (
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">{content.introduction}</p>
        )
      )}

      {/* Meeting info card */}
      <section className="p-5 sm:p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-sidebar-foreground">Mentor Meeting</h3>
        </div>
        {isHtmlContent(agenda) ? (
          <div className="text-muted-foreground mb-4 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: agenda }} />
        ) : (
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{agenda}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
              {roleLabel}
            </div>
            <div className="text-sidebar-foreground font-medium">{roleDescription}</div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
              Next Available
            </div>
            <div className="text-sidebar-foreground font-medium">To be scheduled</div>
          </div>
        </div>
      </section>

      {/* Preparation section */}
      {preparationInstructions && (
        <section className="mb-6">
          <h4 className="text-base font-semibold text-sidebar-foreground mb-3">Preparation</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{preparationInstructions}</p>
        </section>
      )}

      {/* Discussion topics (bulleted) */}
      {discussionQuestions.length > 0 && (
        <section className="mb-6">
          <h4 className="text-base font-semibold text-sidebar-foreground mb-3">Discussion Topics</h4>
          <ul
            className="space-y-3 text-muted-foreground list-none p-0"
            aria-label="Discussion topics for mentor meeting"
          >
            {discussionQuestions.map((topic, idx) => (
              <li key={idx} className="flex items-start gap-3 group">
                <span
                  className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"
                  aria-hidden="true"
                />
                <span className="text-sm group-hover:text-sidebar-foreground transition-colors">
                  {topic}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Schedule button for learners */}
      {isLearner && (
        <div className="mt-6">
          <button
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            aria-label="Schedule a mentor meeting"
          >
            Schedule Meeting
          </button>
        </div>
      )}
    </div>
  );
});

export default MeetingContent;
