'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Send, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { DashboardDiscussion } from '@/hooks/api/useLearnerDashboard';

interface DiscussionThread {
  lessonId: string;
  lessonTitle: string;
  programId: string;
  programName: string;
  posts: DashboardDiscussion[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface RecentCommentsProps {
  tenantId: string;
  discussions: DashboardDiscussion[];
}

export function RecentComments({ tenantId, discussions }: RecentCommentsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingToLesson, setReplyingToLesson] = useState<string | null>(null);

  const threads = useMemo<DiscussionThread[]>(() => {
    const map = new Map<string, DiscussionThread>();
    for (const d of discussions) {
      let thread = map.get(d.lessonId);
      if (!thread) {
        thread = {
          lessonId: d.lessonId,
          lessonTitle: d.lessonTitle,
          programId: d.programId,
          programName: d.programName,
          posts: [],
        };
        map.set(d.lessonId, thread);
      }
      thread.posts.push(d);
    }
    for (const thread of map.values()) {
      thread.posts.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    return Array.from(map.values()).sort((a, b) => {
      const aLatest = new Date(a.posts[a.posts.length - 1].createdAt).getTime();
      const bLatest = new Date(b.posts[b.posts.length - 1].createdAt).getTime();
      return bLatest - aLatest;
    });
  }, [discussions]);

  const replyMutation = useMutation({
    mutationFn: async ({
      programId,
      lessonId,
      content,
    }: {
      programId: string;
      lessonId: string;
      content: string;
    }) => {
      return api.post(
        `/api/tenants/${tenantId}/programs/${programId}/lessons/${lessonId}/discussions`,
        { content }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerDashboard'] });
      setReplyInputs({});
      setReplyingToLesson(null);
    },
  });

  const handleReply = (thread: DiscussionThread) => {
    const content = replyInputs[thread.lessonId]?.trim();
    if (!content) return;
    replyMutation.mutate({
      programId: thread.programId,
      lessonId: thread.lessonId,
      content,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl text-sidebar-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Recent Comments
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Latest discussions from your programs
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl flex-1 overflow-hidden">
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent comments in your programs.
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread.lessonId} className="p-4">
                {/* Thread header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded shrink-0">
                      {thread.programName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {thread.lessonTitle}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/programs/${thread.programId}/learn`)}
                    className="flex items-center gap-1 text-xs text-accent hover:underline shrink-0 ml-2"
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Posts */}
                <div className="space-y-3 pl-1">
                  {thread.posts.map((post) => (
                    <div key={post.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] text-sidebar-foreground shrink-0">
                        {post.authorFirstName?.[0]}
                        {post.authorLastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-sidebar-foreground">
                            {post.authorFirstName} {post.authorLastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-sidebar-foreground">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                {replyingToLesson === thread.lessonId ? (
                  <div className="flex items-center gap-2 mt-3 pl-1">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInputs[thread.lessonId] || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [thread.lessonId]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(thread);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleReply(thread)}
                      disabled={
                        !replyInputs[thread.lessonId]?.trim() || replyMutation.isPending
                      }
                      className="p-1.5 text-accent hover:bg-accent/10 rounded disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReplyingToLesson(null)}
                      className="text-xs text-muted-foreground hover:text-sidebar-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingToLesson(thread.lessonId)}
                    className="text-xs text-accent hover:underline mt-2 pl-1"
                  >
                    Reply
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
