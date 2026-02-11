// Global Search Types

export type SearchResultType =
  | "page"
  | "program"
  | "goal"
  | "person"
  | "coaching_session"
  | "assessment"
  | "article"
  | "setting"
  | "action";

export type SearchCategory =
  | "all"
  | "pages"
  | "programs"
  | "goals"
  | "people"
  | "coaching"
  | "assessments"
  | "help"
  | "settings"
  | "actions";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  url: string;
  category: SearchCategory;
  keywords: string[];
  relevanceScore?: number;
  metadata?: {
    status?: string;
    date?: string;
    progress?: number;
    [key: string]: string | number | undefined;
  };
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

export interface SearchFilter {
  category: SearchCategory;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  filter: SearchFilter;
  recentSearches: RecentSearch[];
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

// Props interfaces
export interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  recentSearches?: RecentSearch[];
  quickActions?: QuickAction[];
}

export interface SearchPageProps {
  initialQuery?: string;
  onNavigate?: (url: string) => void;
}

export interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  onSelect: (result: SearchResult) => void;
  highlightIndex?: number;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}
