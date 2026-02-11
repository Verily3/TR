"use client";

import { useState } from "react";
import {
  Palette,
  Upload,
  Globe,
  Mail,
  Save,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card } from "../ui";
import type { BrandingTabProps } from "./types";
import { defaultBranding } from "./data";

export function BrandingTab({
  branding = defaultBranding,
  onSave,
}: BrandingTabProps) {
  const [config, setConfig] = useState(branding);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setConfig({ ...config, [field]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(config);
    setHasChanges(false);
  };

  const presetColors = [
    { name: "Red", primary: "#1F2937", accent: "#E53E3E" },
    { name: "Blue", primary: "#1E3A5F", accent: "#3B82F6" },
    { name: "Green", primary: "#1F2937", accent: "#10B981" },
    { name: "Purple", primary: "#2D1B4E", accent: "#8B5CF6" },
    { name: "Orange", primary: "#1F2937", accent: "#F97316" },
    { name: "Teal", primary: "#134E4A", accent: "#14B8A6" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-sidebar-foreground">
            Branding & Customization
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of your platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-border text-sidebar-foreground rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="col-span-2 space-y-6">
          {/* Logo & Identity */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Palette className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-sidebar-foreground">
                Logo & Identity
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Logo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                  {config.logo ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={config.logo}
                        alt="Logo"
                        className="h-12 mb-2"
                      />
                      <button className="text-sm text-accent hover:underline">
                        Change Logo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, SVG up to 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Favicon
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                  {config.favicon ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={config.favicon}
                        alt="Favicon"
                        className="w-8 h-8 mb-2"
                      />
                      <button className="text-sm text-accent hover:underline">
                        Change Favicon
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload favicon
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ICO, PNG 32x32px
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={config.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </Card>

          {/* Colors */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Brand Colors
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-sidebar-foreground mb-3">
                Color Presets
              </label>
              <div className="flex items-center gap-3">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      handleChange("primaryColor", preset.primary);
                      handleChange("accentColor", preset.accent);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      config.primaryColor === preset.primary &&
                      config.accentColor === preset.accent
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                    <span className="text-sm text-sidebar-foreground">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => handleChange("accentColor", e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => handleChange("accentColor", e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Domain & Contact */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Domain & Contact
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Custom Domain
                  </div>
                </label>
                <input
                  type="text"
                  value={config.customDomain || ""}
                  onChange={(e) => handleChange("customDomain", e.target.value)}
                  placeholder="app.yourcompany.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Point your CNAME record to platform.transformationos.com
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-sidebar-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Support Email
                  </div>
                </label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </Card>

          {/* Custom CSS */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-sidebar-foreground">
                Custom CSS
              </h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                Advanced
              </span>
            </div>
            <textarea
              value={config.customCSS || ""}
              onChange={(e) => handleChange("customCSS", e.target.value)}
              placeholder="/* Add custom CSS here */"
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-sidebar-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Custom CSS will be applied to all pages. Use with caution.
            </p>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card padding="lg" className="sticky top-8">
            <h3 className="text-lg font-medium text-sidebar-foreground mb-4">
              Preview
            </h3>

            {/* Mini Preview */}
            <div
              className="border border-border rounded-lg overflow-hidden"
              style={{ backgroundColor: config.primaryColor }}
            >
              {/* Header */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    {config.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {config.companyName}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-white/5">
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>

                <button
                  className="mt-4 px-3 py-1.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: config.accentColor }}
                >
                  Button
                </button>
              </div>

              {/* Cards */}
              <div className="p-4 bg-gray-50 grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="h-2 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <button className="text-sm text-muted-foreground hover:text-sidebar-foreground flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
