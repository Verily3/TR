"use client";

import { useState } from "react";
import {
  Search,
  HelpCircle,
  BookOpen,
  Target,
  Users,
  ClipboardList,
  UserCircle,
  Settings,
  CreditCard,
  Plug,
  Wrench,
  Rocket,
  MessageSquare,
  ExternalLink,
  Clock,
  Eye,
  ThumbsUp,
  ChevronRight,
  ArrowLeft,
  Send,
  Ticket,
} from "lucide-react";
import { Card } from "../ui";
import { FAQSection } from "./FAQSection";
import { SupportTicketModal } from "./SupportTicketModal";
import type { HelpPageProps, HelpArticle, ArticleCategory } from "./types";
import {
  helpCategories,
  defaultArticles,
  defaultFAQs,
  defaultTickets,
  categoryConfig,
  ticketStatusConfig,
} from "./data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  BookOpen,
  Target,
  Users,
  ClipboardList,
  UserCircle,
  Settings,
  CreditCard,
  Plug,
  Wrench,
};

type ViewMode = "home" | "category" | "article" | "tickets" | "faq";

export function HelpPage({
  articles = defaultArticles,
  faqs = defaultFAQs,
  categories = helpCategories,
  tickets = defaultTickets,
}: HelpPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTicketModal, setShowTicketModal] = useState(false);

  const popularArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewCategory = (categoryId: ArticleCategory) => {
    setSelectedCategory(categoryId);
    setViewMode("category");
  };

  const handleViewArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setViewMode("article");
  };

  const handleBack = () => {
    if (viewMode === "article") {
      setViewMode(selectedCategory ? "category" : "home");
      setSelectedArticle(null);
    } else {
      setViewMode("home");
      setSelectedCategory(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Article View
  if (viewMode === "article" && selectedArticle) {
    const relatedArticles = selectedArticle.relatedArticles
      ?.map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) as HelpArticle[];

    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sidebar-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {selectedCategory ? "Category" : "Help Center"}
        </button>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <article className="prose max-w-none">
              <div className="mb-6">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                    categoryConfig[selectedArticle.category].bg
                  } ${categoryConfig[selectedArticle.category].text}`}
                >
                  {categories.find((c) => c.id === selectedArticle.category)?.name}
                </span>
                <h1 className="text-3xl font-bold text-sidebar-foreground mb-4">
                  {selectedArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedArticle.readingTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedArticle.views.toLocaleString()} views
                  </span>
                  <span>Updated {formatDate(selectedArticle.updatedAt)}</span>
                </div>
              </div>

              <div className="text-sidebar-foreground whitespace-pre-wrap">
                {selectedArticle.content}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Was this article helpful?
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    Yes ({selectedArticle.helpful})
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                    <ThumbsUp className="w-4 h-4 rotate-180" />
                    No ({selectedArticle.notHelpful})
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div className="space-y-6">
            {relatedArticles && relatedArticles.length > 0 && (
              <Card padding="lg">
                <h3 className="font-medium text-sidebar-foreground mb-4">
                  Related Articles
                </h3>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleViewArticle(article)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="text-sm font-medium text-sidebar-foreground">
                        {article.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {article.readingTime} min read
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <Card padding="lg">
              <h3 className="font-medium text-sidebar-foreground mb-4">
                Need More Help?
              </h3>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </button>
            </Card>
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={() => {}}
        />
      </div>
    );
  }

  // Category View
  if (viewMode === "category" && selectedCategory) {
    const category = categories.find((c) => c.id === selectedCategory);
    const categoryArticles = filteredArticles.filter(
      (a) => a.category === selectedCategory
    );
    const categoryFAQs = faqs.filter((f) => f.category === selectedCategory);

    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sidebar-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl ${categoryConfig[selectedCategory].bg}`}>
              {(() => {
                const Icon = iconMap[category?.icon || "HelpCircle"];
                return <Icon className={`w-6 h-6 ${categoryConfig[selectedCategory].text}`} />;
              })()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-sidebar-foreground">
                {category?.name}
              </h1>
              <p className="text-muted-foreground">{category?.description}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <Card padding="lg">
              <h3 className="font-medium text-sidebar-foreground mb-4">
                Articles ({categoryArticles.length})
              </h3>
              <div className="space-y-3">
                {categoryArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleViewArticle(article)}
                    className="w-full flex items-start justify-between p-4 rounded-lg border border-border hover:border-accent/30 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sidebar-foreground mb-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{article.readingTime} min read</span>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-4" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {categoryFAQs.length > 0 && (
              <Card padding="lg">
                <h3 className="font-medium text-sidebar-foreground mb-4">
                  Frequently Asked
                </h3>
                <FAQSection faqs={categoryFAQs} />
              </Card>
            )}

            <Card padding="lg">
              <h3 className="font-medium text-sidebar-foreground mb-4">
                Still Need Help?
              </h3>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </button>
            </Card>
          </div>
        </div>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={() => {}}
        />
      </div>
    );
  }

  // Tickets View
  if (viewMode === "tickets") {
    return (
      <div className="max-w-[1400px] mx-auto p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sidebar-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-sidebar-foreground">
              My Support Tickets
            </h1>
            <p className="text-muted-foreground">
              Track and manage your support requests
            </p>
          </div>
          <button
            onClick={() => setShowTicketModal(true)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            New Ticket
          </button>
        </header>

        <Card padding="none">
          <div className="divide-y divide-border">
            {tickets.map((ticket) => {
              const statusConf = ticketStatusConfig[ticket.status];
              return (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-muted/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sidebar-foreground">
                        {ticket.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                    >
                      {statusConf.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>#{ticket.id}</span>
                    <span>Created {formatDate(ticket.createdAt)}</span>
                    <span>{ticket.messages.length} messages</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <SupportTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          onSubmit={() => {}}
        />
      </div>
    );
  }

  // Home View (default)
  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="p-3 bg-accent/10 rounded-2xl inline-flex mb-4">
          <HelpCircle className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-sidebar-foreground mb-2">
          How can we help you?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Search our knowledge base or browse categories below
        </p>
      </header>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for articles, guides, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-border rounded-xl bg-background text-sidebar-foreground placeholder:text-muted-foreground text-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {searchTerm && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">
              {filteredArticles.length} results for "{searchTerm}"
            </p>
            <div className="space-y-2">
              {filteredArticles.slice(0, 5).map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleViewArticle(article)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/30 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-sidebar-foreground">
                      {article.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {article.excerpt}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
        <button
          onClick={() => setShowTicketModal(true)}
          className="p-4 border border-border rounded-xl hover:border-accent/30 transition-colors text-center"
        >
          <MessageSquare className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="font-medium text-sidebar-foreground">Contact Support</div>
          <div className="text-sm text-muted-foreground">Get help from our team</div>
        </button>
        <button
          onClick={() => setViewMode("tickets")}
          className="p-4 border border-border rounded-xl hover:border-accent/30 transition-colors text-center"
        >
          <Ticket className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="font-medium text-sidebar-foreground">My Tickets</div>
          <div className="text-sm text-muted-foreground">
            {tickets.length} open tickets
          </div>
        </button>
        <button
          onClick={() => setViewMode("faq")}
          className="p-4 border border-border rounded-xl hover:border-accent/30 transition-colors text-center"
        >
          <HelpCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="font-medium text-sidebar-foreground">FAQs</div>
          <div className="text-sm text-muted-foreground">Quick answers</div>
        </button>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-sidebar-foreground mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || HelpCircle;
            const config = categoryConfig[category.id];
            return (
              <button
                key={category.id}
                onClick={() => handleViewCategory(category.id)}
                className="p-4 border border-border rounded-xl hover:border-accent/30 transition-all text-center group"
              >
                <div
                  className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${config.text}`} />
                </div>
                <div className="font-medium text-sidebar-foreground text-sm">
                  {category.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {category.articleCount} articles
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-sidebar-foreground mb-4">
          Popular Articles
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {popularArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleViewArticle(article)}
              className="p-4 border border-border rounded-xl hover:border-accent/30 transition-colors text-left"
            >
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                  categoryConfig[article.category].bg
                } ${categoryConfig[article.category].text}`}
              >
                {categories.find((c) => c.id === article.category)?.name}
              </span>
              <h3 className="font-medium text-sidebar-foreground mb-1">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Frequently Asked Questions
          </h2>
          <button
            onClick={() => setViewMode("faq")}
            className="text-sm text-accent hover:underline"
          >
            View All
          </button>
        </div>
        <Card padding="lg">
          <FAQSection faqs={faqs.slice(0, 5)} />
        </Card>
      </section>

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSubmit={() => {}}
      />
    </div>
  );
}
