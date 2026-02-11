// Help & Support Types

export type ArticleCategory =
  | "getting-started"
  | "programs"
  | "goals"
  | "coaching"
  | "assessments"
  | "people"
  | "settings"
  | "billing"
  | "integrations"
  | "troubleshooting";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketCategory = "bug" | "feature_request" | "question" | "account" | "billing" | "other";

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  readingTime: number; // in minutes
  relatedArticles?: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: ArticleCategory;
  order: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: "user" | "support";
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface HelpCategory {
  id: ArticleCategory;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

export interface SearchResult {
  type: "article" | "faq";
  id: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  relevance: number;
}

// Props interfaces
export interface HelpPageProps {
  articles?: HelpArticle[];
  faqs?: FAQ[];
  categories?: HelpCategory[];
  tickets?: SupportTicket[];
  onSearch?: (query: string) => void;
  onViewArticle?: (articleId: string) => void;
  onCreateTicket?: (ticket: Partial<SupportTicket>) => void;
}

export interface ArticleViewProps {
  article: HelpArticle;
  relatedArticles?: HelpArticle[];
  onBack: () => void;
  onFeedback?: (articleId: string, helpful: boolean) => void;
}

export interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: Partial<SupportTicket>) => void;
}

export interface FAQSectionProps {
  faqs?: FAQ[];
  category?: ArticleCategory;
}

export interface TicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
  onReply: (message: string) => void;
  onClose: () => void;
}
