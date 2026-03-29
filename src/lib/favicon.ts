/**
 * Favicon URLs for top-site tiles: Chrome's cached favicon API first, then Google's
 * domain service. Tiles advance to the next source on load error or a 16×16 placeholder.
 */

export function getChromeInternalFaviconUrl(pageUrl: string): string | null {
  try {
    new URL(pageUrl);
    if (typeof chrome === "undefined" || !chrome.runtime?.getURL) {
      return null;
    }
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "32");
    return url.toString();
  } catch {
    return null;
  }
}

export function getGoogleFaviconUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const domain = encodeURIComponent(u.hostname);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

/** Ordered favicon sources: extension API when available, then Google. */
export function getFaviconAttempts(pageUrl: string): string[] {
  const chromeUrl = getChromeInternalFaviconUrl(pageUrl);
  const googleUrl = getGoogleFaviconUrl(pageUrl);
  const out: string[] = [];
  if (chromeUrl) out.push(chromeUrl);
  if (googleUrl) out.push(googleUrl);
  return out;
}
