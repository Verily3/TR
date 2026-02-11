"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  ArrowRight,
  Clock,
  Home,
  BarChart3,
  Target,
  BookOpen,
  Users,
  ClipboardList,
  UserCircle,
  PieChart,
  Settings,
  Bell,
  HelpCircle,
  FileText,
  Plus,
  Calendar,
  UserPlus,
  Zap,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Shield,
  User,
} from "lucide-react";
import type { SearchCommandProps, SearchResult } from "./types";
import { searchItems, defaultRecentSearches, statusConfig } from "./data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  BarChart3,
  Target,
  BookOpen,
  Users,
  ClipboardList,
  UserCircle,
  PieChart,
  Settings,
  Bell,
  HelpCircle,
  FileText,
  Plus,
  Calendar,
  UserPlus,
  Zap,
  Shield,
  User,
  Search,
};

export function SearchCommand({
  isOpen,
  onClose,
  onNavigate,
  recentSearches = defaultRecentSearches,
}: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchItems(query);
      setResults(searchResults);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxIndex = results.length > 0 ? results.length - 1 : recentSearches.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results.length > 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          } else if (!query && recentSearches[selectedIndex]) {
            setQuery(recentSearches[selectedIndex].query);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, recentSearches, query, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.url);
    onClose();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, programs, goals, people..."
              className="flex-1 bg-transparent text-sidebar-foreground placeholder:text-muted-foreground text-lg outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-muted-foreground hover:text-sidebar-foreground rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-96 overflow-y-auto"
          >
            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = iconMap[result.icon] || Search;
                  const isSelected = index === selectedIndex;
                  const status = result.metadata?.status
                    ? statusConfig[result.metadata.status]
                    : null;

                  return (
                    <button
                      key={result.id}
                      data-index={index}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-accent/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? "bg-accent/20" : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isSelected ? "text-accent" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium truncate ${
                              isSelected
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground"
                            }`}
                          >
                            {result.title}
                          </span>
                          {status && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}
                            >
                              {status.label}
                            </span>
                          )}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-accent shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No results found for "{query}"
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try different keywords or browse pages
                </p>
              </div>
            )}

            {/* Recent Searches (when no query) */}
            {!query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={search.id}
                      data-index={index}
                      onClick={() => setQuery(search.query)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-accent/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sidebar-foreground">
                        {search.query}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(search.timestamp)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions (when no query) */}
            {!query && (
              <div className="py-2 border-t border-border">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </div>
                {[
                  { icon: Plus, label: "Create New Goal", shortcut: "G" },
                  { icon: Calendar, label: "Schedule Session", shortcut: "S" },
                  { icon: UserPlus, label: "Invite Team Member", shortcut: "I" },
                ].map((action, index) => {
                  const actionIndex = recentSearches.length + index;
                  const isSelected = actionIndex === selectedIndex;
                  return (
                    <button
                      key={action.label}
                      data-index={actionIndex}
                      onMouseEnter={() => setSelectedIndex(actionIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-accent/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <action.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sidebar-foreground">
                        {action.label}
                      </span>
                      <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                        {action.shortcut}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                Select
              </span>
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                Navigate
              </span>
            </div>
            <span>
              {results.length > 0
                ? `${results.length} results`
                : "Type to search"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
