"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentAgency } from "@/stores/auth-store";
import { useAgencyMembers, type AgencyMember } from "@/hooks/api";

const roleLabels: Record<string, { label: string; description: string; color: string }> = {
  owner: {
    label: "Owner",
    description: "Full platform control",
    color: "bg-purple-100 text-purple-700",
  },
  admin: {
    label: "Admin",
    description: "Administrative access across subaccounts",
    color: "bg-blue-100 text-blue-700",
  },
  support: {
    label: "Support",
    description: "Support and setup access",
    color: "bg-green-100 text-green-700",
  },
  analyst: {
    label: "Analyst",
    description: "View-only access for reporting",
    color: "bg-gray-100 text-gray-700",
  },
};

const getInitials = (firstName: string | null, lastName: string | null) => {
  const first = firstName?.[0] || "";
  const last = lastName?.[0] || "";
  return (first + last).toUpperCase() || "?";
};

const getFullName = (firstName: string | null, lastName: string | null) => {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const currentAgency = useCurrentAgency();
  const agencyId = currentAgency?.id || null;

  const { data: membersData, isLoading, error } = useAgencyMembers(agencyId, {
    search: searchQuery || undefined,
  });

  const members = membersData?.items || [];

  // Calculate role counts
  const roleCounts = members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team</h1>
          <p className="text-muted-foreground">
            Manage agency team members and their permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Role Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {Object.entries(roleLabels).map(([key, role]) => {
          const count = roleCounts[key] || 0;
          return (
            <Card key={key} className="hover:border-accent/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{role.label}s</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : count}
                </div>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

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
            <p className="text-muted-foreground">Failed to load team members. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && members.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Get started by inviting your first team member"}
            </p>
            {!searchQuery && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team List */}
      {!isLoading && !error && members.length > 0 && (
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Team Members
            </CardTitle>
            <CardDescription>
              {membersData?.meta.total || members.length} members in your agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MemberRow({ member }: { member: AgencyMember }) {
  const roleInfo = roleLabels[member.role] || roleLabels.analyst;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/30 transition-all">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback>
            {getInitials(member.firstName, member.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {getFullName(member.firstName, member.lastName)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Joined {new Date(member.createdAt).toLocaleDateString()}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Shield className="h-4 w-4 mr-2" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Calendar className="h-4 w-4 mr-2" />
              View Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
