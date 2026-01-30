"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Users,
  BookOpen,
  Activity,
  ExternalLink,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentAgency } from "@/stores/auth-store";
import { useAgencyTenants, type AgencyTenant } from "@/hooks/api";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>;
    case "at-risk":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">At Risk</span>;
    case "trial":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Trial</span>;
    case "inactive":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Inactive</span>;
    default:
      return null;
  }
};

const getEngagementColor = (engagement: number) => {
  if (engagement >= 80) return "bg-accent";
  if (engagement >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const currentAgency = useCurrentAgency();
  const agencyId = currentAgency?.id || null;

  const { data: tenantsData, isLoading, error } = useAgencyTenants(agencyId, {
    search: searchQuery || undefined,
  });

  const clients = tenantsData?.items || [];

  // Filter by status (client-side since API doesn't support status filter yet)
  const filteredClients = clients.filter((client) => {
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clients</h1>
          <p className="text-muted-foreground">
            Manage client subaccounts and monitor their health
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "trial", "inactive"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Failed to load clients. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredClients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first client"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {!isLoading && !error && filteredClients.length > 0 && (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {tenantsData?.meta && tenantsData.meta.total > 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Showing {filteredClients.length} of {tenantsData.meta.total} clients
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: AgencyTenant }) {
  return (
    <Card className="hover:border-accent/30 transition-all group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{client.name}</h3>
                {getStatusBadge(client.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {client.slug} · Created {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Enter as Admin
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BookOpen className="h-4 w-4 mr-2" />
                View Programs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit Client</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Health Metrics */}
        <div className="mt-6 grid grid-cols-5 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">{client.activeUsers}/{client.users}</p>
            </div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">{client.programs}</p>
            </div>
            <p className="text-xs text-muted-foreground">Programs</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">{client.engagement}%</p>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${getEngagementColor(client.engagement)} transition-all`}
                style={{ width: `${client.engagement}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">{client.pendingInvites}</p>
            </div>
            <p className="text-xs text-muted-foreground">Pending Invites</p>
          </div>
          <div className="flex justify-end items-center">
            <button className="text-sm text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
              Enter Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
