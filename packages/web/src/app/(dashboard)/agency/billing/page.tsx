"use client";

import {
  CreditCard,
  DollarSign,
  Users,
  Building2,
  Download,
  Plus,
  MoreHorizontal,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock billing data
const billingStats = [
  { label: "Monthly Revenue", value: "$12,450", change: "+8%" },
  { label: "Active Subscriptions", value: "12", change: "+2" },
  { label: "Total Seats", value: "309", change: "+24" },
  { label: "Avg Revenue/Client", value: "$1,037", change: "+5%" },
];

const subscriptions = [
  {
    id: "1",
    client: "TechStart Inc",
    plan: "Enterprise",
    seats: 150,
    usedSeats: 124,
    amount: 2999,
    status: "active",
    nextBilling: "2025-01-15",
  },
  {
    id: "2",
    client: "Acme Corporation",
    plan: "Professional",
    seats: 50,
    usedSeats: 48,
    amount: 999,
    status: "active",
    nextBilling: "2025-01-10",
  },
  {
    id: "3",
    client: "Global Manufacturing",
    plan: "Professional",
    seats: 100,
    usedSeats: 89,
    amount: 1499,
    status: "past_due",
    nextBilling: "2024-12-15",
  },
  {
    id: "4",
    client: "Summit Partners",
    plan: "Starter",
    seats: 50,
    usedSeats: 36,
    amount: 499,
    status: "active",
    nextBilling: "2025-01-20",
  },
  {
    id: "5",
    client: "Innovate Labs",
    plan: "Trial",
    seats: 25,
    usedSeats: 12,
    amount: 0,
    status: "trial",
    trialEnds: "2025-01-01",
  },
];

const recentInvoices = [
  { id: "INV-001", client: "TechStart Inc", amount: 2999, date: "2024-12-15", status: "paid" },
  { id: "INV-002", client: "Acme Corporation", amount: 999, date: "2024-12-10", status: "paid" },
  { id: "INV-003", client: "Global Manufacturing", amount: 1499, date: "2024-12-15", status: "overdue" },
  { id: "INV-004", client: "Summit Partners", amount: 499, date: "2024-12-20", status: "paid" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>;
    case "past_due":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Past Due</span>;
    case "trial":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Trial</span>;
    case "paid":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Paid</span>;
    case "overdue":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Overdue</span>;
    default:
      return null;
  }
};

export default function BillingPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-sidebar-foreground mb-2">Billing</h1>
          <p className="text-muted-foreground">
            Manage subscriptions, plans, and invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {billingStats.map((stat) => (
          <Card key={stat.label} className="hover:border-accent/30 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-green-600">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert for past due */}
      <Card className="border-red-200 bg-red-50 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <p className="font-medium text-red-800">1 subscription requires attention</p>
              <p className="text-sm text-red-600">Global Manufacturing has a past due payment</p>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Subscriptions */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="hover:border-accent/30 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{sub.client}</h3>
                        {getStatusBadge(sub.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sub.plan} · {sub.usedSeats}/{sub.seats} seats
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sub.status === "trial"
                          ? `Trial ends ${sub.trialEnds ? new Date(sub.trialEnds).toLocaleDateString() : "N/A"}`
                          : `Next billing ${sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : "N/A"}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        ${sub.amount.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Change Plan</DropdownMenuItem>
                        <DropdownMenuItem>Update Seats</DropdownMenuItem>
                        <DropdownMenuItem>Apply Credit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Invoices</h2>
          <Card className="hover:border-accent/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-sm font-medium">{invoice.client}</p>
                        <p className="text-xs text-muted-foreground">{invoice.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${invoice.amount.toLocaleString()}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Invoices
              </Button>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold pt-4">Pricing Plans</h2>
          <Card className="hover:border-accent/30 transition-all">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Starter</span>
                  <span className="text-sm">$499/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Professional</span>
                  <span className="text-sm">$999/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enterprise</span>
                  <span className="text-sm">$2,999/mo</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Manage Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
