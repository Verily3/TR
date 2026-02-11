"use client";

import { useState } from "react";
import {
  MessageSquare,
  Calendar,
  HardDrive,
  Users,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Card } from "../ui";
import type { IntegrationSettingsProps, Integration } from "./types";
import { defaultIntegrations } from "./data";

const categoryIcons: Record<string, React.ReactNode> = {
  communication: <MessageSquare className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
  hr: <Users className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  communication: "Communication",
  calendar: "Calendar",
  storage: "Storage",
  hr: "HR Systems",
  analytics: "Analytics",
};

export function IntegrationSettings({
  integrations = defaultIntegrations,
  onConnect,
  onDisconnect,
}: IntegrationSettingsProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = [...new Set(integrations.map((i) => i.category))];

  const filteredIntegrations =
    filter === "all"
      ? integrations
      : filter === "connected"
        ? integrations.filter((i) => i.connected)
        : integrations.filter((i) => i.category === filter);

  const connectedCount = integrations.filter((i) => i.connected).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        integration.connected
          ? "border-green-200 bg-green-50/50"
          : "border-border hover:border-accent/30"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              integration.connected ? "bg-green-100" : "bg-muted"
            }`}
          >
            {categoryIcons[integration.category]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sidebar-foreground">
                {integration.name}
              </h4>
              {integration.connected && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {integration.description}
            </p>
            {integration.connected && integration.connectedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Connected {formatDate(integration.connectedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {integration.connected && (
            <button className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() =>
              integration.connected
                ? onDisconnect?.(integration.id)
                : onConnect?.(integration.id)
            }
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              integration.connected
                ? "border border-red-200 text-red-600 hover:bg-red-50"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
          >
            {integration.connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sidebar-foreground">
          Integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect third-party services to enhance your workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-2xl font-bold text-sidebar-foreground">
            {integrations.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Available Integrations
          </div>
        </Card>
        <Card padding="md">
          <div className="text-2xl font-bold text-green-600">
            {connectedCount}
          </div>
          <div className="text-sm text-muted-foreground">Connected</div>
        </Card>
        <Card padding="md">
          <div className="text-2xl font-bold text-muted-foreground">
            {integrations.length - connectedCount}
          </div>
          <div className="text-sm text-muted-foreground">Available</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-sidebar-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("connected")}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === "connected"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-sidebar-foreground hover:bg-muted/80"
          }`}
        >
          Connected ({connectedCount})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              filter === category
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-sidebar-foreground hover:bg-muted/80"
            }`}
          >
            {categoryIcons[category]}
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Connected Integrations */}
      {(filter === "all" || filter === "connected") &&
        connectedCount > 0 && (
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Connected Integrations
            </h3>
            <div className="space-y-3">
              {integrations
                .filter((i) => i.connected)
                .map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                  />
                ))}
            </div>
          </Card>
        )}

      {/* Available Integrations by Category */}
      {filter !== "connected" &&
        categories.map((category) => {
          const categoryIntegrations = filteredIntegrations.filter(
            (i) => i.category === category && (filter === "all" || !i.connected)
          );
          if (categoryIntegrations.length === 0) return null;

          return (
            <Card key={category} padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  {categoryIcons[category]}
                </div>
                <h3 className="text-lg font-medium text-sidebar-foreground">
                  {categoryLabels[category]}
                </h3>
              </div>
              <div className="space-y-3">
                {categoryIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                  />
                ))}
              </div>
            </Card>
          );
        })}

      {/* Request Integration */}
      <Card padding="lg" className="border-dashed">
        <div className="text-center py-4">
          <h3 className="font-medium text-sidebar-foreground mb-2">
            Need a different integration?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're always adding new integrations. Let us know what you need.
          </p>
          <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Request Integration
          </button>
        </div>
      </Card>
    </div>
  );
}
