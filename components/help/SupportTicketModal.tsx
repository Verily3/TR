"use client";

import { useState } from "react";
import {
  X,
  Send,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import type { SupportTicketModalProps, TicketCategory, TicketPriority } from "./types";

export function SupportTicketModal({
  isOpen,
  onClose,
  onSubmit,
}: SupportTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("question");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      subject,
      description,
      category,
      priority,
      status: "open",
    });
    setIsSubmitting(false);
    setSubject("");
    setDescription("");
    setCategory("question");
    setPriority("medium");
    onClose();
  };

  const categoryOptions: { value: TicketCategory; label: string; description: string }[] = [
    { value: "question", label: "Question", description: "General questions about the platform" },
    { value: "bug", label: "Bug Report", description: "Something isn't working correctly" },
    { value: "feature_request", label: "Feature Request", description: "Suggest a new feature" },
    { value: "account", label: "Account", description: "Account access or settings issues" },
    { value: "billing", label: "Billing", description: "Payment or subscription questions" },
    { value: "other", label: "Other", description: "Anything else" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Contact Support
            </h2>
            <p className="text-sm text-muted-foreground">
              We'll get back to you within 24 hours
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              What do you need help with?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCategory(option.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === option.value
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <div className="text-sm font-medium text-sidebar-foreground">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide as much detail as possible..."
              rows={5}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="low">Low - General question, no rush</option>
              <option value="medium">Medium - Need help soon</option>
              <option value="high">High - Blocking my work</option>
              <option value="urgent">Urgent - Critical issue</option>
            </select>
          </div>

          {/* Attachment hint */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="w-4 h-4" />
            <span>You can add attachments after creating the ticket</span>
          </div>

          {/* Tips */}
          <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Include any error messages, screenshots, or steps to reproduce the issue for faster resolution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim() || isSubmitting}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Sending..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
