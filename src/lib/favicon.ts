/**
 * Get a favicon URL for a site.
 * Uses Google's domain-based favicon service so icons load without visiting each site.
 * Chrome's extension _favicon URL often returns a generic globe for origins that are
 * not in the local favicon cache (but the image still loads, so <img onError> never runs).
 */
export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    const domain = encodeURIComponent(u.hostname);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
}

