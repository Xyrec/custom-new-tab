/**
 * Get a favicon URL for a site.
 * Uses Chrome's built-in favicon service when available,
 * falls back to Google's public favicon service.
 */
export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    // Chrome extension environment: use chrome://favicon2
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(u.origin)}&size=32`;
    }
    // Dev fallback: Google's public favicon service
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

/**
 * Get the first letter of a domain for the letter-fallback tile.
 */
export function getLetterFallback(titleOrUrl: string): string {
  if (!titleOrUrl) return "?";
  // Try to get the first letter of the title
  const letter = titleOrUrl.replace(/^https?:\/\/(www\.)?/, "").charAt(0);
  return letter.toUpperCase() || "?";
}

/**
 * Generate a consistent color from a URL string.
 * Matches Firefox's approach of hashing the URL to pick from a color palette.
 */
const COLORS = [
  "#0a84ff", // blue
  "#008ea4", // teal
  "#9059ff", // purple
  "#ff0090", // magenta
  "#ed00b5", // pink
  "#d76e00", // orange
  "#b5007f", // fuchsia
  "#058b00", // green
  "#a47f00", // amber
  "#7c353c", // maroon
  "#1e7e34", // forest
  "#5b5b66", // gray
];

export function hashColor(url: string): string {
  let hash = 0;
  const str = url.replace(/^https?:\/\/(www\.)?/, "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit int
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
