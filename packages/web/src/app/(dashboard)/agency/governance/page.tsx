"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  FileText,
  Clock,
  AlertTriangle,
  Download,
  Search,
  User,
  Settings,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock audit log data
const auditLogs = [
  {
    id: "1",
    user: "Sarah Johnson",
    action: "Updated pricing plan",
    target: "TechStart Inc",
    timestamp: "2024-12-20 14:32",
    category: "billing",
  },
  {
    id: "2",
    user: "Michael Chen",
    action: "Created new client",
    target: "Innovate Labs",
    timestamp: "2024-12-20 11:15",
    category: "clients",
  },
  {
    id: "3",
    user: "Emily Rodriguez",
    action: "Entered client account",
    target: "Acme Corporation",
    timestamp: "2024-12-19 16:45",
    category: "access",
  },
  {
    id: "4",
    user: "Sarah Johnson",
    action: "Updated assessment framework",
    target: "Leadership 360",
    timestamp: "2024-12-19 10:22",
    category: "content",
  },
  {
    id: "5",
    user: "David Kim",
    action: "Exported analytics report",
    target: "Portfolio Q4 2024",
    timestamp: "2024-12-18 15:30",
    category: "reports",
  },
];

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    billing: "bg-green-100 text-green-700",
    clients: "bg-blue-100 text-blue-700",
    access: "bg-purple-100 text-purple-700",
    content: "bg-orange-100 text-orange-700",
    reports: "bg-gray-100 text-gray-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
};

export default function GovernancePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-sidebar-foreground mb-2">Governance</h1>
        <p className="text-muted-foreground">
          Compliance controls, data retention policies, and audit logs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Privacy & Data Retention */}
          <Card className="hover:border-accent/30 transition-all mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                Privacy & Data Retention
              </CardTitle>
              <CardDescription>
                Configure data handling and retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Data Retention Period</p>
                  <p className="text-sm text-muted-foreground">
                    How long to keep user data after account closure
                  </p>
                </div>
                <Select defaultValue="1year">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">30 days</SelectItem>
                    <SelectItem value="90days">90 days</SelectItem>
                    <SelectItem value="1year">1 year</SelectItem>
                    <SelectItem value="3years">3 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Audit Log Retention</p>
                  <p className="text-sm text-muted-foreground">
                    How long to keep audit logs
                  </p>
                </div>
                <Select defaultValue="3years">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1year">1 year</SelectItem>
                    <SelectItem value="3years">3 years</SelectItem>
                    <SelectItem value="5years">5 years</SelectItem>
                    <SelectItem value="7years">7 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">GDPR Data Export</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to request their data export
                  </p>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Right to Deletion</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to request account deletion
                  </p>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Compliance */}
          <Card className="hover:border-accent/30 transition-all mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Email Compliance
              </CardTitle>
              <CardDescription>
                Required footers and disclaimers for all emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Required Email Footer</Label>
                <Textarea
                  className="h-24"
                  defaultValue="This email was sent by Transformation Partners on behalf of {{client_name}}. To manage your preferences, visit your account settings."
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{client_name}}"}, {"{{user_name}}"}, {"{{unsubscribe_link}}"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
                <div>
                  <p className="font-medium">Unsubscribe Link Required</p>
                  <p className="text-sm text-muted-foreground">
                    Include unsubscribe link in all marketing emails
                  </p>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Track all administrative actions
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audit logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 rounded-lg border hover:border-accent/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{log.user}</span>
                          {" "}{log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.target}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                View All Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Access Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Require invitation</span>
                <Button variant="outline" size="sm">On</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SSO enforcement</span>
                <Button variant="outline" size="sm">Off</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">2FA required</span>
                <Button variant="outline" size="sm">Optional</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">IP whitelist</span>
                <Button variant="outline" size="sm">Off</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">GDPR</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Compliant</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SOC 2</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data encryption</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-accent" />
                Support Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                View-as User
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
