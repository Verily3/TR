'use client';

import { memo } from 'react';
import { Lightbulb } from 'lucide-react';
import type { LessonContent } from '@/types/programs';
import { isHtmlContent } from '@/lib/html-utils';

interface ReadingContentProps {
  moduleNumber: number;
  moduleTitle: string;
  content: LessonContent;
}

/**
 * Reading lesson content component.
 * Displays rich text content with key concepts and takeaways.
 */
export const ReadingContent = memo(function ReadingContent({
  moduleNumber,
  moduleTitle,
  content,
}: ReadingContentProps) {
  const introduction =
    content.introduction ||
    `This section covers the key ideas and frameworks for Module ${moduleNumber}: ${moduleTitle}.`;

  const mainContent = content.mainContent || '';
  const isHtml = isHtmlContent(mainContent);
  const mainParagraphs = !isHtml && mainContent
    ? mainContent.split('\n').filter((p) => p.trim().length > 0)
    : [];

  const keyConcepts = content.keyConcepts ?? [];
  const reflectionPrompts = content.reflectionPrompts ?? [];

  return (
    <article className="max-w-none">
      <h3 className="text-lg sm:text-xl font-semibold text-sidebar-foreground mb-4">
        Module {moduleNumber}: {moduleTitle}
      </h3>
      {isHtmlContent(introduction) ? (
        <div className="text-muted-foreground mb-6 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: introduction }} />
      ) : (
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">{introduction}</p>
      )}

      {isHtml ? (
        <div
          className="mb-6 text-sm sm:text-base prose prose-sm prose-slate max-w-none prose-headings:text-sidebar-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-accent prose-a:underline prose-strong:text-sidebar-foreground"
          dangerouslySetInnerHTML={{ __html: mainContent }}
        />
      ) : mainParagraphs.length > 0 ? (
        <div className="text-muted-foreground mb-6 text-sm sm:text-base space-y-4">
          {mainParagraphs.map((paragraph, index) => (
            <p key={index} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {keyConcepts.length > 0 && (
        <>
          <h4 className="text-base sm:text-lg font-semibold text-sidebar-foreground mt-6 mb-3">Key Concepts</h4>
          <ul className="space-y-4 text-muted-foreground list-none p-0">
            {keyConcepts.map((concept, index) => (
              <li
                key={index}
                className="p-4 sm:p-5 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors"
              >
                <h5 className="text-sidebar-foreground font-medium mb-2">
                  {index + 1}. {concept.title}
                </h5>
                <p className="text-sm m-0">{concept.description}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {content.keyTakeaway && (
        <aside className="mt-8 p-5 sm:p-6 bg-gradient-to-br from-accent/5 to-accent/10 border border-accent rounded-xl">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Lightbulb className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="text-sidebar-foreground font-semibold mb-2">Key Takeaway</h4>
              <p className="text-muted-foreground text-sm m-0">
                {content.keyTakeaway}
              </p>
            </div>
          </div>
        </aside>
      )}

      {reflectionPrompts.length > 0 && (
        <div className="mt-8">
          <h4 className="text-base sm:text-lg font-semibold text-sidebar-foreground mb-3">Reflection Prompts</h4>
          <ul className="space-y-3 text-muted-foreground list-none p-0">
            {reflectionPrompts.map((prompt, index) => (
              <li
                key={index}
                className="p-4 sm:p-5 bg-muted/30 rounded-xl border border-border/50 hover:border-border transition-colors text-sm"
              >
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
});

export default ReadingContent;
