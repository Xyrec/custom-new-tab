/**
 * Favicon URL resolution with multiple fallback sources.
 * Returns an ordered list of URLs to try — the img tag cycles through
 * them on error or when the returned image is a tiny placeholder.
 *
 * Sources (in order):
 * 1. Chrome's internal favicon cache (extension only, instant)
 * 2. DuckDuckGo icon service (good coverage, no API key)
 * 3. Google S2 favicon service (broadest coverage, final fallback)
 */

function getChromeInternalUrl(pageUrl: string): string | null {
  try {
    new URL(pageUrl);
    if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return null;
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "32");
    return url.toString();
  } catch {
    return null;
  }
}

function getDuckDuckGoUrl(pageUrl: string): string | null {
  try {
    const domain = new URL(pageUrl).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return null;
  }
}

function getGoogleUrl(pageUrl: string): string | null {
  try {
    const domain = new URL(pageUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  } catch {
    return null;
  }
}

/** Ordered favicon source URLs to try for a given page URL. */
export function getFaviconAttempts(pageUrl: string): string[] {
  return [getChromeInternalUrl(pageUrl), getDuckDuckGoUrl(pageUrl), getGoogleUrl(pageUrl)].filter(
    (u): u is string => u !== null,
  );
}
