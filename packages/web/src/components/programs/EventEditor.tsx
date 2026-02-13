'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Video, Save, Trash2, Clock } from 'lucide-react';
import { getEmbedUrl, getVideoProvider } from '@/lib/video-utils';
import type { Module, EventConfig, UpdateModuleInput } from '@/types/programs';

interface EventEditorProps {
  event: Module;
  onSave: (input: UpdateModuleInput) => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function EventEditor({ event, onSave, onDelete, isSaving, isDeleting }: EventEditorProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [config, setConfig] = useState<EventConfig>(event.eventConfig || {});

  // Sync when event changes
  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description || '');
    setConfig(event.eventConfig || {});
  }, [event.id]);

  const handleSave = () => {
    onSave({
      title: title.trim() || 'Untitled Event',
      description: description.trim() || undefined,
      eventConfig: config,
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    onDelete();
  };

  const updateConfig = (updates: Partial<EventConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Program Event</h2>
            <p className="text-sm text-gray-500">Configure event details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Event Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
              placeholder="Event title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={config.description || description}
              onChange={(e) => {
                setDescription(e.target.value);
                updateConfig({ description: e.target.value });
              }}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-gray-50"
              placeholder="Describe this event..."
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          Schedule
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={config.date || ''}
              onChange={(e) => updateConfig({ date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <input
              type="text"
              value={config.timezone || ''}
              onChange={(e) => updateConfig({ timezone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
              placeholder="e.g. America/New_York"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
            <input
              type="time"
              value={config.startTime || ''}
              onChange={(e) => updateConfig({ startTime: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
            <input
              type="time"
              value={config.endTime || ''}
              onChange={(e) => updateConfig({ endTime: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Location & Meeting */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          Location & Meeting
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              value={config.location || ''}
              onChange={(e) => updateConfig({ location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
              placeholder="Physical location or 'Virtual'"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zoom / Meeting Link</label>
            <input
              type="url"
              value={config.zoomLink || ''}
              onChange={(e) => updateConfig({ zoomLink: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
              placeholder="https://zoom.us/j/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting ID</label>
              <input
                type="text"
                value={config.meetingId || ''}
                onChange={(e) => updateConfig({ meetingId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
                placeholder="Meeting ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="text"
                value={config.meetingPassword || ''}
                onChange={(e) => updateConfig({ meetingPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
                placeholder="Meeting password"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Video className="w-4 h-4 text-gray-400" />
          Video
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL</label>
          <input
            type="url"
            value={config.videoUrl || ''}
            onChange={(e) => updateConfig({ videoUrl: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {config.videoUrl && (() => {
            const embedUrl = getEmbedUrl(config.videoUrl);
            const provider = getVideoProvider(config.videoUrl);
            if (embedUrl && provider) {
              return (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <div className="aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Event video preview"
                    />
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
}
