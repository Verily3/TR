'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  BookOpen,
  Users,
  Target,
  BarChart3,
  Loader2,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useSearch, type SearchResultItem } from '@/hooks/api/useSearch';

interface CommandPaletteProps {
  tenantId: string | null | undefined;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_CONFIG = {
  programs: { label: 'Programs', icon: BookOpen, color: 'text-blue-500' },
  people: { label: 'People', icon: Users, color: 'text-green-500' },
  goals: { label: 'Goals', icon: Target, color: 'text-orange-500' },
  assessments: { label: 'Assessments', icon: BarChart3, color: 'text-purple-500' },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

const QUICK_LINKS: SearchResultItem[] = [
  {
    id: 'ql-dashboard',
    type: 'program',
    title: 'Dashboard',
    subtitle: 'Your overview',
    url: '/dashboard',
  },
  {
    id: 'ql-programs',
    type: 'program',
    title: 'Programs',
    subtitle: 'Learning & development',
    url: '/programs',
  },
  {
    id: 'ql-goals',
    type: 'goal',
    title: 'Planning & Goals',
    subtitle: 'Set and track goals',
    url: '/planning',
  },
  {
    id: 'ql-mentoring',
    type: 'person',
    title: 'Mentoring',
    subtitle: 'Sessions & relationships',
    url: '/mentoring',
  },
  {
    id: 'ql-assessments',
    type: 'assessment',
    title: 'Assessments',
    subtitle: '360° feedback',
    url: '/assessments',
  },
  {
    id: 'ql-settings',
    type: 'program',
    title: 'Settings',
    subtitle: 'Account & preferences',
    url: '/settings',
  },
];

export function CommandPalette({ tenantId, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useSearch(tenantId, debouncedQuery);

  // Flatten results for keyboard nav
  const flatResults = useMemo((): SearchResultItem[] => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) return QUICK_LINKS;
    if (!data) return [];
    return [...data.programs, ...data.people, ...data.goals, ...data.assessments];
  }, [data, debouncedQuery]);

  const hasResults = flatResults.length > 0;

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [flatResults]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const navigate = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatResults[activeIdx]) {
        navigate(flatResults[activeIdx].url);
      }
    },
    [flatResults, activeIdx, navigate, onClose]
  );

  if (!open) return null;

  const showGrouped = debouncedQuery.trim().length >= 2;
  const showEmpty =
    showGrouped &&
    !isFetching &&
    data &&
    data.programs.length === 0 &&
    data.people.length === 0 &&
    data.goals.length === 0 &&
    data.assessments.length === 0;

  // Render a single result row
  const renderItem = (item: SearchResultItem, idx: number) => {
    const cfg = CATEGORY_CONFIG[item.type as CategoryKey] ?? CATEGORY_CONFIG.programs;
    const Icon = cfg.icon;
    const isActive = idx === activeIdx;
    return (
      <button
        key={item.id}
        data-idx={idx}
        onMouseEnter={() => setActiveIdx(idx)}
        onClick={() => navigate(item.url)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
          isActive ? 'bg-muted' : 'hover:bg-muted/60'
        }`}
      >
        <div className={`p-1.5 rounded-lg bg-muted/80 shrink-0 ${cfg.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
          )}
        </div>
        {isActive && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
    );
  };

  let resultIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {isFetching ? (
            <Loader2 className="w-5 h-5 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, people, goals…"
            className="flex-1 bg-transparent text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono border border-border">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!showGrouped && (
            <>
              <div className="px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Quick links
              </div>
              {QUICK_LINKS.map((item) => {
                const el = renderItem(item, resultIdx);
                resultIdx++;
                return el;
              })}
            </>
          )}

          {showGrouped && isFetching && !data && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Searching…
            </div>
          )}

          {showEmpty && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">
                No results for <span className="font-medium">"{debouncedQuery}"</span>
              </p>
            </div>
          )}

          {showGrouped && data && (
            <>
              {(
                Object.entries(CATEGORY_CONFIG) as [
                  CategoryKey,
                  (typeof CATEGORY_CONFIG)[CategoryKey],
                ][]
              ).map(([key, cfg]) => {
                const items = data[key as keyof typeof data];
                if (!items?.length) return null;
                return (
                  <div key={key}>
                    <div className="px-4 pt-3 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {cfg.label}
                    </div>
                    {items.map((item) => {
                      const el = renderItem(item, resultIdx);
                      resultIdx++;
                      return el;
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {hasResults && (
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Command className="w-3 h-3" />
              <span>K</span>
              to toggle
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
