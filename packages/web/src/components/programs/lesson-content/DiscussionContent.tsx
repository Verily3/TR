'use client';

import { memo, useState, useCallback, useId } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { isHtmlContent } from '@/lib/html-utils';
import type { DiscussionPost } from '@/types/programs';

type DiscussionTab = 'yours' | 'others';

interface DiscussionContentProps {
  lessonTitle: string;
  prompt?: string;
  minCharacters?: number;
  posts: DiscussionPost[];
  isLoading?: boolean;
  currentUserId?: string;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0) ?? '';
  const l = lastName?.charAt(0) ?? '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Discussion lesson content component.
 * Tab-based UI: "Your comment" (compose + own posts) and "Others' comments" (peer feed).
 */
export const DiscussionContent = memo(function DiscussionContent({
  lessonTitle,
  prompt,
  minCharacters = 50,
  posts,
  isLoading = false,
  currentUserId,
  onSubmit,
  isSubmitting = false,
}: DiscussionContentProps) {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<DiscussionTab>('yours');
  const textareaId = useId();
  const characterCountId = useId();

  const isValid = text.length >= minCharacters;

  const ownPosts = posts.filter((p) => p.userId === currentUserId);
  const otherPosts = posts.filter((p) => p.userId !== currentUserId);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isValid) {
      onSubmit(text);
      setText('');
    }
  }, [isValid, onSubmit, text]);

  return (
    <div>
      <h3 className="text-lg font-semibold text-sidebar-foreground mb-3">{lessonTitle}</h3>
      {prompt && (
        isHtmlContent(prompt) ? (
          <div className="text-muted-foreground mb-6 text-sm sm:text-base prose prose-sm max-w-none prose-p:text-muted-foreground" dangerouslySetInnerHTML={{ __html: prompt }} />
        ) : (
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">{prompt}</p>
        )
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('yours')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'yours'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-sidebar-foreground hover:border-border'
          }`}
        >
          Your comment
          {ownPosts.length > 0 && (
            <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{ownPosts.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('others')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'others'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-sidebar-foreground hover:border-border'
          }`}
        >
          Others&apos; comments
          {otherPosts.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{otherPosts.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'yours' ? (
        <div>
          {/* Compose area */}
          <label htmlFor={textareaId} className="block text-sm font-medium text-sidebar-foreground mb-2">Write a comment</label>
          <textarea
            id={textareaId}
            value={text}
            onChange={handleChange}
            placeholder="Share your thoughts with fellow participants..."
            className="w-full h-40 sm:h-48 p-4 bg-card border border-border rounded-xl text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition-shadow text-sm sm:text-base"
            aria-describedby={characterCountId}
            aria-invalid={text.length > 0 && !isValid}
          />

          <div className="flex items-center justify-between mt-3">
            <div>
              <span
                id={characterCountId}
                className={`text-sm ${isValid ? 'text-accent' : 'text-muted-foreground'}`}
                aria-live="polite"
              >
                {text.length} characters {!isValid && <span className="text-xs">(min {minCharacters})</span>}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Your message will be shared with other program members and is visible in the Feed.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center gap-2"
              aria-label={`Post comment (${text.length} of ${minCharacters} minimum characters)`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>

          {/* Own previous posts */}
          {ownPosts.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Your previous comments</h4>
              <div className="space-y-3">
                {ownPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-accent/5 border border-accent/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Others' posts feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-4 bg-card border border-border rounded-xl animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-full bg-muted rounded mb-2" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : otherPosts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No comments from others yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {otherPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-card border border-border rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
                      {getInitials(post.authorFirstName, post.authorLastName)}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-sidebar-foreground truncate">
                        {post.authorFirstName} {post.authorLastName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DiscussionContent;
