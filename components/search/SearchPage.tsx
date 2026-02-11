"use client";

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Filter,
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
  Clock,
  ChevronRight,
  Layout,
  MessageSquare,
  Shield,
  User,
  ArrowRight,
} from "lucide-react";
import { Card } from "../ui";
import type { SearchPageProps, SearchResult, SearchCategory } from "./types";
import {
  searchItems,
  searchableItems,
  defaultRecentSearches,
  categoryLabels,
  categoryIcons,
  statusConfig,
} from "./data";

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
  Clock,
  Layout,
  MessageSquare,
  Shield,
  User,
  Search,
};

export function SearchPage({ initialQuery = "", onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("all");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        const searchResults = searchItems(query, selectedCategory);
        setResults(searchResults);
        setIsSearching(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query, selectedCategory]);

  const handleSelect = (result: SearchResult) => {
    onNavigate?.(result.url);
  };

  // Group results by category
  const groupedResults = results.reduce(
    (acc, result) => {
      const category = result.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    },
    {} as Record<SearchCategory, SearchResult[]>
  );

  // Get category counts for all items
  const categoryCounts = searchableItems.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories: SearchCategory[] = [
    "all",
    "pages",
    "programs",
    "goals",
    "people",
    "coaching",
    "assessments",
    "help",
    "settings",
    "actions",
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground">
              Search
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find anything in Transformation OS
            </p>
          </div>
        </div>
      </header>

      {/* Search Input */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, programs, goals..."
            autoFocus
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border border-border rounded-xl bg-background text-sidebar-foreground placeholder:text-muted-foreground text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-sidebar-foreground rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar - Categories */}
        <div className="space-y-4 lg:order-none order-2">
          {/* Categories - Horizontal scroll on mobile, vertical on desktop */}
          <Card padding="md">
            <h3 className="font-medium text-sidebar-foreground mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Categories
            </h3>
            <div className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
              {categories.map((category) => {
                const Icon = iconMap[categoryIcons[category]] || Search;
                const isSelected = selectedCategory === category;
                const count = query
                  ? results.filter(
                      (r) => category === "all" || r.category === category
                    ).length
                  : categoryCounts[category] || 0;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap lg:w-full shrink-0 ${
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-sidebar-foreground hover:bg-muted border border-border lg:border-0"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{categoryLabels[category]}</span>
                    </div>
                    <span
                      className={`text-xs ${
                        isSelected ? "text-accent-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Recent Searches - Hidden on mobile when there's a query */}
          {!query && (
            <Card padding="md" className="hidden lg:block">
              <h3 className="font-medium text-sidebar-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent
              </h3>
              <div className="space-y-1">
                {defaultRecentSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => setQuery(search.query)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{search.query}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Tips - Hidden on mobile */}
          <Card padding="md" className="bg-blue-50 border-blue-200 hidden lg:block">
            <h3 className="font-medium text-blue-800 mb-2">Search Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use keywords from titles</li>
              <li>• Search for people by name</li>
              <li>• Try "create goal" for actions</li>
              <li>• Press Cmd+K for quick search</li>
            </ul>
          </Card>
        </div>

        {/* Main Content - Results */}
        <div className="lg:col-span-3 order-1 lg:order-none">
          {/* Loading */}
          {isSearching && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!isSearching && query && results.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {results.length} results for "{query}"
                  {selectedCategory !== "all" &&
                    ` in ${categoryLabels[selectedCategory]}`}
                </p>
              </div>

              {selectedCategory === "all" ? (
                // Grouped by category
                Object.entries(groupedResults).map(([category, items]) => (
                  <Card key={category} padding="none">
                    <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon =
                            iconMap[categoryIcons[category as SearchCategory]] ||
                            Search;
                          return <Icon className="w-4 h-4 text-muted-foreground" />;
                        })()}
                        <span className="font-medium text-sidebar-foreground">
                          {categoryLabels[category as SearchCategory]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({items.length})
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedCategory(category as SearchCategory)
                        }
                        className="text-sm text-accent hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {items.slice(0, 3).map((result) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          onClick={() => handleSelect(result)}
                        />
                      ))}
                    </div>
                  </Card>
                ))
              ) : (
                // Flat list
                <Card padding="none">
                  <div className="divide-y divide-border">
                    {results.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        onClick={() => handleSelect(result)}
                      />
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* No Results */}
          {!isSearching && query && results.length === 0 && (
            <Card padding="lg">
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-sidebar-foreground mb-1">
                  No results found
                </h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find anything matching "{query}"
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Suggestions:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Check your spelling</li>
                    <li>• Try different keywords</li>
                    <li>• Use more general terms</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Empty State (no query) */}
          {!isSearching && !query && (
            <div className="space-y-6">
              {/* Popular Searches */}
              <Card padding="lg">
                <h3 className="font-medium text-sidebar-foreground mb-4">
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "leadership",
                    "goals",
                    "coaching session",
                    "team",
                    "assessment",
                    "settings",
                    "help",
                    "notifications",
                  ].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-muted text-sidebar-foreground rounded-full text-sm hover:bg-accent/10 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Browse Categories */}
              <Card padding="lg">
                <h3 className="font-medium text-sidebar-foreground mb-4">
                  Browse by Category
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories
                    .filter((c) => c !== "all")
                    .map((category) => {
                      const Icon = iconMap[categoryIcons[category]] || Search;
                      return (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setQuery(" "); // Trigger search with space
                          }}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-accent/30 transition-colors text-left"
                        >
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-sidebar-foreground">
                              {categoryLabels[category]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {categoryCounts[category] || 0} items
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResultItem({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  const Icon = iconMap[result.icon] || Search;
  const status = result.metadata?.status ? statusConfig[result.metadata.status] : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="p-2 bg-muted rounded-lg shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sidebar-foreground truncate">
            {result.title}
          </span>
          {status && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${status.bg} ${status.text}`}
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
        {result.description && (
          <div className="text-sm text-muted-foreground truncate mt-0.5">
            {result.description}
          </div>
        )}
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}
