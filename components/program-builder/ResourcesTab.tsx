"use client";

import { FileText, Plus, Upload, Link } from "lucide-react";

export function ResourcesTab() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-sidebar-foreground mb-2">
              Program Resources
            </h2>
            <p className="text-muted-foreground">
              Supplementary materials, downloads, and external links for participants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
              <Link className="w-4 h-4" />
              Add Link
            </button>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-card border border-border rounded-lg p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-medium text-sidebar-foreground mb-2">
              No Resources Added
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add supplementary materials like PDFs, templates, worksheets, or
              external links to enhance the learning experience.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button className="px-6 py-2.5 border border-border rounded-lg text-sm text-sidebar-foreground hover:bg-muted transition-colors flex items-center gap-2">
                <Link className="w-4 h-4" />
                Add External Link
              </button>
              <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Resource
              </button>
            </div>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Documents
            </div>
            <div className="text-xs text-muted-foreground">PDFs, Word docs, presentations</div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Templates
            </div>
            <div className="text-xs text-muted-foreground">Worksheets, forms, checklists</div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              External Links
            </div>
            <div className="text-xs text-muted-foreground">Articles, videos, tools</div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-sidebar-foreground mb-1">
              Media
            </div>
            <div className="text-xs text-muted-foreground">Images, audio, infographics</div>
            <div className="mt-3 text-2xl font-medium text-sidebar-foreground">0</div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mt-8">
          <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
            <Plus className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-sidebar-foreground mb-1">
              Drag and drop files here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse from your computer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
