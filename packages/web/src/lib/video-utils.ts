/**
 * Video URL utilities for parsing YouTube/Vimeo URLs into embeddable formats.
 */

/**
 * Extract a YouTube video ID from various URL formats.
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract a Vimeo video ID from various URL formats.
 */
function getVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Detect which video provider a URL belongs to.
 */
export function getVideoProvider(url: string): 'youtube' | 'vimeo' | 'other' | null {
  if (!url) return null;
  if (getYouTubeId(url)) return 'youtube';
  if (getVimeoId(url)) return 'vimeo';
  // Check if it looks like a valid URL at all
  try {
    new URL(url);
    return 'other';
  } catch {
    return null;
  }
}

/**
 * Convert a video URL into an embeddable iframe URL.
 * Returns null if the URL is invalid or unrecognized.
 */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;

  const vimeoId = getVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;

  // For other URLs, check if it's a valid URL and pass through
  // (could be a direct video file or other embed service)
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}
