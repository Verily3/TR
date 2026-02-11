"use client";

import {
  BookOpen,
  Target,
  ClipboardList,
  Users,
  MessageSquare,
  Award,
  AtSign,
  Settings,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Check,
  Archive,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import type { NotificationCardProps, NotificationType } from "./types";
import { notificationTypeConfig, priorityConfig } from "./data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Target,
  ClipboardList,
  Users,
  MessageSquare,
  Award,
  AtSign,
  Settings,
  Clock,
  CheckCircle,
};

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onClick,
}: NotificationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const typeConfig = notificationTypeConfig[notification.type];
  const prioConfig = priorityConfig[notification.priority];
  const Icon = iconMap[typeConfig.icon] || Settings;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleClick = () => {
    if (notification.status === "unread") {
      onMarkAsRead?.(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={`relative p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
        notification.status === "unread" ? "bg-accent/5" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${typeConfig.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${typeConfig.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-medium ${
                  notification.status === "unread"
                    ? "text-sidebar-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {notification.title}
              </h4>
              {notification.status === "unread" && (
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
              )}
              {notification.priority === "high" || notification.priority === "urgent" ? (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${prioConfig.bg} ${prioConfig.text}`}
                >
                  {prioConfig.label}
                </span>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(notification.timestamp)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Sender & Action */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {notification.sender && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
                    {notification.sender.name.slice(0, 1)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {notification.sender.name}
                  </span>
                </div>
              )}
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${typeConfig.bg} ${typeConfig.text}`}
              >
                {typeConfig.label}
              </span>
            </div>

            {notification.actionLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle action navigation
                }}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                {notification.actionLabel}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                {notification.status === "unread" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead?.(notification.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-sidebar-foreground hover:bg-muted flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive?.(notification.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-sidebar-foreground hover:bg-muted flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(notification.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact variant for dropdown
export function NotificationCardCompact({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationCardProps) {
  const typeConfig = notificationTypeConfig[notification.type];
  const Icon = iconMap[typeConfig.icon] || Settings;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
        notification.status === "unread" ? "bg-accent/5" : ""
      }`}
      onClick={() => {
        if (notification.status === "unread") {
          onMarkAsRead?.(notification.id);
        }
        onClick?.(notification);
      }}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded ${typeConfig.bg} shrink-0`}>
          <Icon className={`w-4 h-4 ${typeConfig.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-medium truncate ${
                notification.status === "unread"
                  ? "text-sidebar-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {notification.title}
            </span>
            {notification.status === "unread" && (
              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {notification.message}
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatTime(notification.timestamp)}
        </span>
      </div>
    </div>
  );
}
