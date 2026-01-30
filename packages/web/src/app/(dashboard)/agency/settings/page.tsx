"use client";

import {
  Settings,
  Building2,
  Globe,
  Bell,
  Mail,
  Shield,
  CreditCard,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentAgency } from "@/stores/auth-store";

export default function SettingsPage() {
  const agency = useCurrentAgency();

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-sidebar-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your agency account settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Agency Details */}
          <Card className="hover:border-accent/30 transition-all mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Agency Details
              </CardTitle>
              <CardDescription>
                Basic information about your agency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input id="agencyName" defaultValue={agency?.name || "Transformation Partners"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencySlug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">app.transformationos.com/</span>
                  <Input id="agencySlug" defaultValue="transformation-partners" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input id="supportEmail" type="email" defaultValue="support@transformationpartners.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input id="supportPhone" type="tel" defaultValue="+1 (555) 123-4567" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="hover:border-accent/30 transition-all mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">New Client Signups</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new client signs up</p>
                </div>
                <Button variant="outline" size="sm">Email + In-App</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Payment Issues</p>
                  <p className="text-sm text-muted-foreground">Alerts for failed payments or past due accounts</p>
                </div>
                <Button variant="outline" size="sm">Email + In-App</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Portfolio summary sent every Monday</p>
                </div>
                <Button variant="outline" size="sm">Email</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Client At-Risk Alerts</p>
                  <p className="text-sm text-muted-foreground">When a client's engagement drops significantly</p>
                </div>
                <Button variant="outline" size="sm">Email + In-App</Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure email sending preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Default Sender Name</Label>
                <Input id="senderName" defaultValue="Transformation Partners" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Default Sender Email</Label>
                <Input id="senderEmail" type="email" defaultValue="noreply@transformationpartners.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input id="replyTo" type="email" defaultValue="support@transformationpartners.com" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Include Logo in Emails</p>
                  <p className="text-sm text-muted-foreground">Show agency logo in email headers</p>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Links */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2 text-accent" />
                Manage Team
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2 text-accent" />
                Billing Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2 text-accent" />
                Security Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2 text-accent" />
                API & Integrations
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono">ag_1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span>Enterprise</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>Jan 15, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Clients</span>
                <span>12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Seats</span>
                <span>309</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                Export All Data
              </Button>
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                Close Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
