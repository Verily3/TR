"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Filter,
  Search,
  Settings,
  Inbox,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card } from "../ui";
import { NotificationCard } from "./NotificationCard";
import { NotificationPreferencesPanel } from "./NotificationPreferences";
import type { NotificationsPageProps, Notification, NotificationType, NotificationPriority } from "./types";
import { defaultNotifications, defaultPreferences, defaultStats, notificationTypeConfig, priorityConfig } from "./data";

type ViewMode = "all" | "unread" | "archived";
type TabMode = "notifications" | "preferences";

export function NotificationsPage({
  notifications = defaultNotifications,
  preferences = defaultPreferences,
  stats = defaultStats,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onUpdatePreferences,
}: NotificationsPageProps) {
  const [notificationList, setNotificationList] = useState(notifications);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [tabMode, setTabMode] = useState<TabMode>("notifications");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleMarkAsRead = (id: string) => {
    setNotificationList(
      notificationList.map((n) =>
        n.id === id ? { ...n, status: "read" as const } : n
      )
    );
    onMarkAsRead?.(id);
  };

  const handleMarkAllAsRead = () => {
    setNotificationList(
      notificationList.map((n) => ({ ...n, status: "read" as const }))
    );
    onMarkAllAsRead?.();
  };

  const handleArchive = (id: string) => {
    setNotificationList(
      notificationList.map((n) =>
        n.id === id ? { ...n, status: "archived" as const } : n
      )
    );
    onArchive?.(id);
  };

  const handleDelete = (id: string) => {
    setNotificationList(notificationList.filter((n) => n.id !== id));
    onDelete?.(id);
  };

  const filteredNotifications = notificationList
    .filter((n) => {
      if (viewMode === "unread") return n.status === "unread";
      if (viewMode === "archived") return n.status === "archived";
      return n.status !== "archived";
    })
    .filter((n) => (typeFilter === "all" ? true : n.type === typeFilter))
    .filter((n) => (priorityFilter === "all" ? true : n.priority === priorityFilter))
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const unreadCount = notificationList.filter((n) => n.status === "unread").length;

  // Group notifications by date
  const groupNotifications = (notifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups: { label: string; notifications: Notification[] }[] = [
      { label: "Today", notifications: [] },
      { label: "Yesterday", notifications: [] },
      { label: "This Week", notifications: [] },
      { label: "Earlier", notifications: [] },
    ];

    notifications.forEach((n) => {
      const date = new Date(n.timestamp);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        groups[0].notifications.push(n);
      } else if (date.getTime() === yesterday.getTime()) {
        groups[1].notifications.push(n);
      } else if (date >= thisWeek) {
        groups[2].notifications.push(n);
      } else {
        groups[3].notifications.push(n);
      }
    });

    return groups.filter((g) => g.notifications.length > 0);
  };

  const groupedNotifications = groupNotifications(filteredNotifications);

  if (tabMode === "preferences") {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="mb-6">
          <button
            onClick={() => setTabMode("notifications")}
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            <Bell className="w-4 h-4" />
            Back to Notifications
          </button>
        </div>
        <NotificationPreferencesPanel
          preferences={preferences}
          onSave={onUpdatePreferences}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-sidebar-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                Stay up to date with your activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={() => setTabMode("preferences")}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Preferences
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Inbox className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {unreadCount}
              </div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {stats.byPriority.high + stats.byPriority.urgent}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sidebar-foreground">
                {stats.byType.deadline + stats.byType.goal_reminder}
              </div>
              <div className="text-sm text-muted-foreground">Action Required</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="col-span-3">
          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === "all"
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode("unread")}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  viewMode === "unread"
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      viewMode === "unread"
                        ? "bg-accent-foreground/20"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode("archived")}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === "archived"
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                Archived
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground text-sm w-48 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Types</option>
                {Object.entries(notificationTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Priority</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <Card padding="none">
            {groupedNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <div key={group.label}>
                  <div className="px-4 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-sidebar-foreground font-medium mb-1">
                  No Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || typeFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : viewMode === "unread"
                      ? "You're all caught up!"
                      : "You don't have any notifications yet"}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Filters by Type */}
          <Card padding="lg">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
              Filter by Type
            </h3>
            <div className="space-y-2">
              {Object.entries(notificationTypeConfig).map(([key, config]) => {
                const count = stats.byType[key as NotificationType] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setTypeFilter(typeFilter === key ? "all" : key)
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      typeFilter === key
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-muted text-sidebar-foreground"
                    }`}
                  >
                    <span className="text-sm">{config.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.text}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Filters by Priority */}
          <Card padding="lg">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
              Filter by Priority
            </h3>
            <div className="space-y-2">
              {Object.entries(priorityConfig).map(([key, config]) => {
                const count = stats.byPriority[key as NotificationPriority] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setPriorityFilter(priorityFilter === key ? "all" : key)
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      priorityFilter === key
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-muted text-sidebar-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="lg">
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-sidebar-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Mark all as read</span>
              </button>
              <button
                onClick={() => setTabMode("preferences")}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-sidebar-foreground hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Notification settings</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
