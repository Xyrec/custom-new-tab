export type ManifestIcon = {
  src?: string;
  icon?: string;
  url?: string;
  sizes?: string;
};

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "reload" });
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

export async function resolveFavicon(pageUrl: string): Promise<string | null> {
  try {
    const domain = new URL(pageUrl).hostname;

    // 1) manifest.json
    try {
      const manifestUrl = new URL("/manifest.json", pageUrl).toString();
      const manifest = await fetchJson(manifestUrl);
      if (manifest && Array.isArray(manifest.icons) && manifest.icons.length) {
        const pick = (manifest.icons as ManifestIcon[])
          .map((i) => ({ src: i.src || i.icon || i.url, sizes: i.sizes || "" }))
          .map((i) => ({
            ...i,
            maxSize: (i.sizes || "")
              .split(" ")
              .map((s) => parseInt(s, 10) || 0)
              .reduce((a, b) => Math.max(a, b), 0),
          }))
          .sort((a, b) => b.maxSize - a.maxSize)[0];

        if (pick && pick.src) {
          return new URL(pick.src, manifestUrl).toString();
        }
      }
    } catch {
      /* ignore */
    }

    // 2) parse HTML link rel icons
    try {
      const res = await fetch(pageUrl, { cache: "reload" });
      if (res.ok) {
        const html = await res.text();
        const linkRe = /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*>/gi;
        const hrefRe = /href=["']([^"']+)["']/i;
        const sizesRe = /sizes=["']([^"']+)["']/i;
        let match: RegExpExecArray | null;
        const candidates: { href: string; sizes?: string }[] = [];
        while ((match = linkRe.exec(html))) {
          const tag = match[0];
          const hrefMatch = tag.match(hrefRe);
          const sizesMatch = tag.match(sizesRe);
          if (hrefMatch) {
            candidates.push({
              href: hrefMatch[1],
              sizes: sizesMatch ? sizesMatch[1] : undefined,
            });
          }
        }

        if (candidates.length) {
          candidates.sort((a, b) => {
            const aMax = a.sizes
              ? Math.max(...a.sizes.split(" ").map((s) => parseInt(s, 10) || 0))
              : 0;
            const bMax = b.sizes
              ? Math.max(...b.sizes.split(" ").map((s) => parseInt(s, 10) || 0))
              : 0;
            return bMax - aMax;
          });
          const pick = candidates[0];
          if (pick && pick.href) return new URL(pick.href, pageUrl).toString();
        }
      }
    } catch {
      /* ignore */
    }

    // 3) DuckDuckGo
    try {
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    } catch {
      /* ignore */
    }

    // 4) FaviconGrabber
    try {
      const fgUrl = `https://favicongrabber.com/api/grab/${domain}`;
      const json = await fetchJson(fgUrl);
      if (json && Array.isArray(json.icons) && json.icons.length) {
        return json.icons[0].src || null;
      }
    } catch {
      /* ignore */
    }

    // 5) Google S2 fallback
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}
