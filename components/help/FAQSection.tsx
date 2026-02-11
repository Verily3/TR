"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "../ui";
import type { FAQSectionProps } from "./types";
import { defaultFAQs } from "./data";

export function FAQSection({ faqs = defaultFAQs, category }: FAQSectionProps) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const filteredFAQs = category
    ? faqs.filter((faq) => faq.category === category)
    : faqs;

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (filteredFAQs.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No FAQs found for this category</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {filteredFAQs.map((faq) => {
        const isOpen = openIds.includes(faq.id);
        return (
          <div
            key={faq.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-sidebar-foreground pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact FAQ item for inline use
export function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-sidebar-foreground pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <p className="text-sm text-muted-foreground pb-3">{answer}</p>
      )}
    </div>
  );
}
