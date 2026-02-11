"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  FileText,
  Palette,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { Card } from "../ui";
import { ClientsTab } from "./ClientsTab";
import { TemplatesTab } from "./TemplatesTab";
import { BrandingTab } from "./BrandingTab";
import { AgencyBillingTab } from "./AgencyBillingTab";
import type { AgencyPageProps } from "./types";
import {
  defaultAgencyStats,
  defaultClients,
  defaultTemplates,
  defaultBranding,
  defaultAgencyBilling,
} from "./data";

type Tab = "overview" | "clients" | "templates" | "branding" | "billing";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "clients", label: "Clients", icon: <Building2 className="w-4 h-4" /> },
  { id: "templates", label: "Templates", icon: <FileText className="w-4 h-4" /> },
  { id: "branding", label: "Branding", icon: <Palette className="w-4 h-4" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
];

export function AgencyPage({
  stats = defaultAgencyStats,
  clients = defaultClients,
  templates = defaultTemplates,
  branding = defaultBranding,
  billing = defaultAgencyBilling,
}: AgencyPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="max-w-[1400px] mx-auto p-8">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Building2 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-sidebar-foreground">
              Agency Portal
            </h1>
            <p className="text-muted-foreground">
              Manage clients, templates, and platform settings
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-background"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.mrrGrowth}%
                </span>
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {formatCurrency(stats.totalMRR)}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            </Card>

            <Card padding="lg">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {stats.totalClients}
              </div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
              <div className="text-xs text-green-600 mt-1">
                {stats.activeClients} active
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-xs text-muted-foreground mt-1">
                ~{stats.avgUsersPerClient} per client
              </div>
            </Card>

            <Card padding="lg">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-6 h-6 text-purple-600" />
                {stats.churnRate > 3 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="text-3xl font-bold text-sidebar-foreground mb-1">
                {stats.trialConversionRate}%
              </div>
              <div className="text-sm text-muted-foreground">Trial Conversion</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.churnRate}% churn rate
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Clients */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-sidebar-foreground">
                  Recent Clients
                </h3>
                <button
                  onClick={() => setActiveTab("clients")}
                  className="text-sm text-accent hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-medium">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sidebar-foreground">
                          {client.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.users} users
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sidebar-foreground">
                        {formatCurrency(client.mrr)}
                      </div>
                      <div className="text-xs text-muted-foreground">/month</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue by Tier */}
            <Card padding="lg">
              <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
                Revenue by Tier
              </h3>
              <div className="space-y-4">
                {[
                  {
                    tier: "Enterprise",
                    amount: billing.revenueByTier.enterprise,
                    color: "bg-accent",
                  },
                  {
                    tier: "Professional",
                    amount: billing.revenueByTier.professional,
                    color: "bg-purple-500",
                  },
                  {
                    tier: "Starter",
                    amount: billing.revenueByTier.starter,
                    color: "bg-gray-400",
                  },
                ].map((item) => {
                  const percentage = (item.amount / stats.totalMRR) * 100;
                  return (
                    <div key={item.tier}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-sidebar-foreground">
                          {item.tier}
                        </span>
                        <span className="text-sm font-medium text-sidebar-foreground">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total MRR</span>
                  <span className="text-xl font-bold text-sidebar-foreground">
                    {formatCurrency(stats.totalMRR)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground">Projected ARR</span>
                  <span className="text-lg font-medium text-sidebar-foreground">
                    {formatCurrency(billing.totalARR)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Template Usage */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-sidebar-foreground">
                Popular Templates
              </h3>
              <button
                onClick={() => setActiveTab("templates")}
                className="text-sm text-accent hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {templates
                .filter((t) => t.isPublished)
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 4)
                .map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="text-sm font-medium text-sidebar-foreground mb-1">
                      {template.name}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {template.category}
                    </div>
                    <div className="text-2xl font-bold text-accent">
                      {template.usageCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      times used
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "clients" && <ClientsTab clients={clients} />}
      {activeTab === "templates" && <TemplatesTab templates={templates} />}
      {activeTab === "branding" && <BrandingTab branding={branding} />}
      {activeTab === "billing" && (
        <AgencyBillingTab billing={billing} clients={clients} />
      )}
    </main>
  );
}
