"use client";

import { useState } from "react";
import {
  Building2,
  CreditCard,
  Check,
  Upload,
  Calendar,
  Users,
  HardDrive,
} from "lucide-react";
import { Card } from "../ui";
import type { AccountSettingsProps } from "./types";
import { defaultOrganization, defaultBilling, planFeatures, timezones } from "./data";

export function AccountSettings({
  organization = defaultOrganization,
  billing = defaultBilling,
  onSave,
}: AccountSettingsProps) {
  const [orgData, setOrgData] = useState(organization);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setOrgData({ ...orgData, [field]: value });
    setHasChanges(true);
  };

  const handleFeatureToggle = (feature: string, value: boolean) => {
    setOrgData({
      ...orgData,
      features: { ...orgData.features, [feature]: value },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(orgData);
    setHasChanges(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    starter: "bg-blue-100 text-blue-700",
    professional: "bg-purple-100 text-purple-700",
    enterprise: "bg-accent/10 text-accent",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Account Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings and billing
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            Save Changes
          </button>
        )}
      </div>

      {/* Organization Info */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Organization Details
          </h3>
        </div>

        <div className="flex items-start gap-8 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {orgData.name.slice(0, 2).toUpperCase()}
            </div>
            <button className="absolute -bottom-2 -right-2 p-1.5 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors">
              <Upload className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Organization Logo</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or SVG. Max size 1MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Domain
            </label>
            <input
              type="text"
              value={orgData.domain}
              onChange={(e) => handleChange("domain", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Industry
            </label>
            <select
              value={orgData.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Company Size
            </label>
            <select
              value={orgData.size}
              onChange={(e) => handleChange("size", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              <option value="1-50">1-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500-1000">500-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Timezone
            </label>
            <select
              value={orgData.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sidebar-foreground mb-2">
              Date Format
            </label>
            <select
              value={orgData.dateFormat}
              onChange={(e) => handleChange("dateFormat", e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Features */}
      <Card padding="lg">
        <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
          Enabled Features
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(orgData.features).map(([key, enabled]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <span className="text-sidebar-foreground capitalize">{key}</span>
              <button
                onClick={() => handleFeatureToggle(key, !enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  enabled ? "bg-accent" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Billing */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Billing & Subscription
          </h3>
        </div>

        {/* Current Plan */}
        <div className="p-4 border border-border rounded-lg mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${planColors[billing.plan]}`}
                >
                  {billing.plan}
                </span>
                <span className="text-sm text-muted-foreground">
                  Billed {billing.billingCycle}
                </span>
              </div>
              <ul className="space-y-1">
                {planFeatures[billing.plan].map((feature, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-sidebar-foreground">
                {billing.usage.users}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                / {billing.usage.usersLimit}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-accent rounded-full"
                style={{
                  width: `${(billing.usage.users / billing.usage.usersLimit) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Storage</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-sidebar-foreground">
                {billing.usage.storage} GB
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                / {billing.usage.storageLimit} GB
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(billing.usage.storage / billing.usage.storageLimit) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium text-sidebar-foreground">
                {billing.paymentMethod?.brand} ending in{" "}
                {billing.paymentMethod?.last4}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Next billing: {formatDate(billing.nextBillingDate)}
              </div>
            </div>
          </div>
          <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors">
            Update
          </button>
        </div>
      </Card>

      {/* Invoices */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-sidebar-foreground">
            Recent Invoices
          </h3>
          <button className="text-sm text-accent hover:underline">
            View All
          </button>
        </div>
        <div className="space-y-2">
          {[
            { date: "Jan 1, 2025", amount: "$499.00", status: "Paid" },
            { date: "Dec 1, 2024", amount: "$499.00", status: "Paid" },
            { date: "Nov 1, 2024", amount: "$499.00", status: "Paid" },
          ].map((invoice, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <div className="text-sm text-sidebar-foreground">
                  {invoice.date}
                </div>
                <div className="text-xs text-muted-foreground">
                  Professional Plan - Monthly
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {invoice.amount}
                </span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {invoice.status}
                </span>
                <button className="text-sm text-accent hover:underline">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
