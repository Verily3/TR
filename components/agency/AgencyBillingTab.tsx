"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Card } from "../ui";
import type { AgencyBillingTabProps } from "./types";
import { defaultAgencyBilling, defaultClients, clientStatusConfig, tierConfig } from "./data";

type TransactionFilter = "all" | "subscription" | "addon" | "refund";

export function AgencyBillingTab({
  billing = defaultAgencyBilling,
  clients = defaultClients,
}: AgencyBillingTabProps) {
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredTransactions = billing.recentTransactions.filter((t) =>
    transactionFilter === "all" ? true : t.type === transactionFilter
  );

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    switch (type) {
      case "subscription":
        return <RefreshCw className="w-4 h-4 text-green-500" />;
      case "addon":
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "subscription":
        return { label: "Subscription", bg: "bg-green-100", text: "text-green-700" };
      case "addon":
        return { label: "Add-on", bg: "bg-blue-100", text: "text-blue-700" };
      case "refund":
        return { label: "Refund", bg: "bg-red-100", text: "text-red-700" };
      default:
        return { label: type, bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  const activeClients = clients.filter((c) => c.status === "active");
  const trialClients = clients.filter((c) => c.status === "trial");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Billing & Revenue
          </h2>
          <p className="text-sm text-muted-foreground">
            Track revenue, manage subscriptions, and view transaction history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              +12.5%
            </span>
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {formatCurrency(billing.totalMRR)}
          </div>
          <div className="text-sm text-muted-foreground">Monthly Revenue</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {formatCurrency(billing.totalARR)}
          </div>
          <div className="text-sm text-muted-foreground">Annual Revenue</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {formatCurrency(billing.outstandingInvoices)}
          </div>
          <div className="text-sm text-muted-foreground">Outstanding</div>
          <div className="text-xs text-yellow-600 mt-1">3 pending invoices</div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-sidebar-foreground mb-1">
            {formatCurrency(billing.totalMRR / activeClients.length)}
          </div>
          <div className="text-sm text-muted-foreground">Avg. Revenue/Client</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Revenue by Tier */}
        <Card padding="lg" className="col-span-2">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Revenue by Subscription Tier
          </h3>

          <div className="space-y-6">
            {[
              {
                tier: "Enterprise",
                amount: billing.revenueByTier.enterprise,
                clients: clients.filter((c) => c.subscriptionTier === "enterprise" && c.status === "active").length,
                color: "bg-accent",
              },
              {
                tier: "Professional",
                amount: billing.revenueByTier.professional,
                clients: clients.filter((c) => c.subscriptionTier === "professional" && c.status === "active").length,
                color: "bg-purple-500",
              },
              {
                tier: "Starter",
                amount: billing.revenueByTier.starter,
                clients: clients.filter((c) => c.subscriptionTier === "starter" && c.status === "active").length,
                color: "bg-gray-400",
              },
            ].map((item) => {
              const percentage = (item.amount / billing.totalMRR) * 100;
              return (
                <div key={item.tier}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sidebar-foreground">
                        {item.tier}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({item.clients} clients)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sidebar-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-sidebar-foreground">
                  {activeClients.length}
                </div>
                <div className="text-sm text-muted-foreground">Paying Clients</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sidebar-foreground">
                  {trialClients.length}
                </div>
                <div className="text-sm text-muted-foreground">On Trial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">68%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions & Summary */}
        <Card padding="lg">
          <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
            Billing Summary
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Collected This Month</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(billing.totalMRR - billing.outstandingInvoices)}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-700">Pending Collection</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">
                {formatCurrency(billing.outstandingInvoices)}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Projected Next Month</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(billing.totalMRR * 1.05)}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <button className="w-full px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              View Payment Issues
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Recent Transactions
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value as TransactionFilter)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sidebar-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscriptions</option>
              <option value="addon">Add-ons</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Transaction
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const typeLabel = getTransactionLabel(transaction.type);
                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {transaction.id.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sidebar-foreground">
                          {transaction.clientName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${typeLabel.bg} ${typeLabel.text}`}
                      >
                        {typeLabel.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-medium ${
                          transaction.amount < 0
                            ? "text-red-600"
                            : "text-sidebar-foreground"
                        }`}
                      >
                        {transaction.amount < 0 ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">Completed</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} transactions
          </span>
          <button className="text-sm text-accent hover:underline">
            View All Transactions
          </button>
        </div>
      </Card>

      {/* Client Subscriptions */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Active Subscriptions
          </h3>
          <button className="text-sm text-accent hover:underline">
            Manage All
          </button>
        </div>

        <div className="space-y-3">
          {clients
            .filter((c) => c.status === "active" && c.mrr > 0)
            .sort((a, b) => b.mrr - a.mrr)
            .slice(0, 5)
            .map((client) => {
              const tierConf = tierConfig[client.subscriptionTier];
              return (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-medium">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sidebar-foreground">
                        {client.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierConf.bg} ${tierConf.text}`}
                        >
                          {tierConf.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {client.users} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sidebar-foreground">
                      {formatCurrency(client.mrr)}
                    </div>
                    <div className="text-xs text-muted-foreground">/month</div>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
