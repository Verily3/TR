"use client";

import { useState } from "react";
import {
  Palette,
  Upload,
  Building2,
  Globe,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock branding data
const agencyBranding = {
  name: "Transformation Partners",
  logo: null,
  primaryColor: "#1F2937",
  secondaryColor: "#3B82F6",
  accentColor: "#EF4444",
};

const clientBranding = [
  {
    id: "1",
    name: "Acme Corporation",
    hasCustomBranding: true,
    primaryColor: "#2563EB",
    logo: null,
  },
  {
    id: "2",
    name: "TechStart Inc",
    hasCustomBranding: true,
    primaryColor: "#059669",
    logo: null,
  },
  {
    id: "3",
    name: "Global Manufacturing",
    hasCustomBranding: false,
    primaryColor: null,
    logo: null,
  },
  {
    id: "4",
    name: "Summit Partners",
    hasCustomBranding: true,
    primaryColor: "#7C3AED",
    logo: null,
  },
  {
    id: "5",
    name: "Innovate Labs",
    hasCustomBranding: false,
    primaryColor: null,
    logo: null,
  },
];

export default function BrandingPage() {
  const [primaryColor, setPrimaryColor] = useState(agencyBranding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(agencyBranding.secondaryColor);
  const [accentColor, setAccentColor] = useState(agencyBranding.accentColor);

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-sidebar-foreground mb-2">Branding</h1>
        <p className="text-muted-foreground">
          Manage white-label branding for your agency and clients
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agency Branding (Default) */}
        <Card className="hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              Agency Default Theme
            </CardTitle>
            <CardDescription>
              This theme is used as the fallback for clients without custom branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Agency Logo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Recommended: 200x200px, PNG or SVG</p>
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 rounded-lg border bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="font-semibold">Transformation Partners</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    style={{ backgroundColor: primaryColor }}
                    className="hover:opacity-90"
                  >
                    Primary
                  </Button>
                  <Button
                    size="sm"
                    style={{ backgroundColor: secondaryColor }}
                    className="hover:opacity-90"
                  >
                    Secondary
                  </Button>
                  <Button
                    size="sm"
                    style={{ backgroundColor: accentColor }}
                    className="hover:opacity-90"
                  >
                    Accent
                  </Button>
                </div>
              </div>
            </div>

            <Button className="w-full">Save Agency Theme</Button>
          </CardContent>
        </Card>

        {/* Client Branding Overview */}
        <div className="space-y-4">
          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Client Branding
              </CardTitle>
              <CardDescription>
                Manage custom branding for each client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientBranding.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded flex items-center justify-center"
                        style={{
                          backgroundColor: client.hasCustomBranding && client.primaryColor
                            ? client.primaryColor
                            : primaryColor
                        }}
                      >
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.hasCustomBranding ? "Custom branding" : "Using agency default"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.hasCustomBranding && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                Custom Domains
              </CardTitle>
              <CardDescription>
                Configure custom domains for clients (Enterprise feature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/30 transition-all">
                  <div>
                    <p className="text-sm font-medium">app.acme-corp.com</p>
                    <p className="text-xs text-muted-foreground">Acme Corporation</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-accent/30 transition-all">
                  <div>
                    <p className="text-sm font-medium">learning.techstart.io</p>
                    <p className="text-xs text-muted-foreground">TechStart Inc</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Add Custom Domain
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
