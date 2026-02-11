"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Building2,
  Users,
  Calendar,
  Mail,
  ExternalLink,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { Card } from "../ui";
import type { ClientsTabProps, ClientStatus } from "./types";
import { defaultClients, clientStatusConfig, tierConfig } from "./data";

type FilterStatus = "all" | ClientStatus;

export function ClientsTab({
  clients = defaultClients,
  onViewClient,
  onCreateClient,
}: ClientsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filteredClients = clients
    .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
    .filter((c) => (tierFilter === "all" ? true : c.subscriptionTier === tierFilter))
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return "Just now";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Client Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your client organizations and subscriptions
          </p>
        </div>
        <button
          onClick={onCreateClient}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="churned">Churned</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Clients Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Users
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  MRR
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Last Active
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const statusConf = clientStatusConfig[client.status];
                const tierConf = tierConfig[client.subscriptionTier];
                return (
                  <tr
                    key={client.id}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => onViewClient?.(client.id)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-medium">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sidebar-foreground">
                            {client.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {client.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}
                      >
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${tierConf.bg} ${tierConf.text}`}
                      >
                        {tierConf.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sidebar-foreground">
                          {client.users}
                        </span>
                        <span className="text-muted-foreground">
                          / {client.usersLimit}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-sidebar-foreground">
                        {client.mrr > 0 ? formatCurrency(client.mrr) : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {getTimeSince(client.lastActivity)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://${client.domain}`, "_blank");
                          }}
                          className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${client.contactEmail}`;
                          }}
                          className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-muted-foreground hover:text-sidebar-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredClients.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sidebar-foreground mb-2">No Clients Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || tierFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first client to get started"}
            </p>
            <button
              onClick={onCreateClient}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Add Client
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
