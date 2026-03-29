import { useState, useEffect, useCallback } from "react";

export interface TopSite {
  url: string;
  title: string;
  pinned: boolean;
  customTitle?: string;
  customUrl?: string;
}

interface TopSitesState {
  sites: TopSite[];
  rows: number;
  loading: boolean;
}

const STORAGE_KEY = "topSitesCustomizations";
const ROWS_KEY = "topSitesRows";
const COLS = 8; // max columns at widest breakpoint

interface StoredData {
  pinned: Record<string, { title?: string; url: string; originalUrl?: string }>;
  removed: string[];
  custom: TopSite[];
}

function getEmptyStore(): StoredData {
  return { pinned: {}, removed: [], custom: [] };
}

async function loadStorage(): Promise<{ stored: StoredData; rows: number }> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const data = await chrome.storage.local.get([STORAGE_KEY, ROWS_KEY]);
    return {
      stored: (data[STORAGE_KEY] as StoredData) || getEmptyStore(),
      rows: (data[ROWS_KEY] as number) || 2,
    };
  }
  // Fallback for dev mode (no chrome APIs)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      stored: raw ? JSON.parse(raw) : getEmptyStore(),
      rows: Number(localStorage.getItem(ROWS_KEY)) || 2,
    };
  } catch {
    return { stored: getEmptyStore(), rows: 2 };
  }
}

async function saveStorage(stored: StoredData, rows: number) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({
      [STORAGE_KEY]: stored,
      [ROWS_KEY]: rows,
    });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    localStorage.setItem(ROWS_KEY, String(rows));
  }
}

async function fetchBrowserTopSites(): Promise<
  { url: string; title: string }[]
> {
  if (typeof chrome !== "undefined" && chrome.topSites?.get) {
    return new Promise((resolve) => {
      chrome.topSites.get((sites) => resolve(sites || []));
    });
  }
  // Dev mode fallback
  return [
    { url: "https://www.google.com", title: "Google" },
    { url: "https://www.youtube.com", title: "YouTube" },
    { url: "https://www.github.com", title: "GitHub" },
    { url: "https://www.reddit.com", title: "Reddit" },
    { url: "https://www.wikipedia.org", title: "Wikipedia" },
    { url: "https://www.twitter.com", title: "Twitter" },
    { url: "https://www.amazon.com", title: "Amazon" },
    { url: "https://www.stackoverflow.com", title: "Stack Overflow" },
    { url: "https://www.twitch.tv", title: "Twitch" },
    { url: "https://www.netflix.com", title: "Netflix" },
    { url: "https://www.linkedin.com", title: "LinkedIn" },
    { url: "https://www.discord.com", title: "Discord" },
  ];
}

function mergeSites(
  stored: StoredData,
  browserSites: { url: string; title: string }[],
  rows: number
): TopSite[] {
  const maxSlots = COLS * 4;
  const result: (TopSite | null)[] = new Array(maxSlots).fill(null);

  // Place pinned sites at their stored positions
  for (const [posStr, pinData] of Object.entries(stored.pinned)) {
    const pos = Number(posStr);
    if (pos >= 0 && pos < maxSlots) {
      result[pos] = {
        url: pinData.url,
        title: pinData.title || "",
        pinned: true,
        customTitle: pinData.title,
        customUrl: pinData.url,
      };
    }
  }

  // Fill remaining slots with custom-added + browser top sites (excluding removed & already placed)
  const placedUrls = new Set(
    result.filter(Boolean).map((s) => normalizeUrl(s!.url))
  );
  const removedSet = new Set(stored.removed.map(normalizeUrl));

  const toFill = [
    ...stored.custom.filter(
      (s) =>
        !placedUrls.has(normalizeUrl(s.url)) &&
        !removedSet.has(normalizeUrl(s.url))
    ),
    ...browserSites.filter(
      (s) =>
        !placedUrls.has(normalizeUrl(s.url)) &&
        !removedSet.has(normalizeUrl(s.url))
    ),
  ];

  let fillIdx = 0;
  for (let i = 0; i < maxSlots && fillIdx < toFill.length; i++) {
    if (!result[i]) {
      const site = toFill[fillIdx++];
      result[i] = {
        url: site.url,
        title: (site as TopSite).customTitle || site.title,
        pinned: (site as TopSite).pinned || false,
      };
      placedUrls.add(normalizeUrl(site.url));
    }
  }

  return result
    .slice(0, Math.max(rows * COLS, maxSlots))
    .filter((s): s is TopSite => s !== null);
}

export function useTopSites() {
  const [state, setState] = useState<TopSitesState>({
    sites: [],
    rows: 2,
    loading: true,
  });

  const refresh = useCallback(async () => {
    const { stored, rows } = await loadStorage();
    const browserSites = await fetchBrowserTopSites();
    const sites = mergeSites(stored, browserSites, rows);
    setState({ sites, rows, loading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { stored, rows } = await loadStorage();
      const browserSites = await fetchBrowserTopSites();
      if (cancelled) return;
      const sites = mergeSites(stored, browserSites, rows);
      setState({ sites, rows, loading: false });
    })();
    return () => { cancelled = true; };
  }, []);

  const pinSite = useCallback(
    async (index: number) => {
      const { stored, rows } = await loadStorage();
      const site = state.sites[index];
      if (!site) return;
      stored.pinned[String(index)] = { title: site.title, url: site.url };
      await saveStorage(stored, rows);
      refresh();
    },
    [state.sites, refresh]
  );

  const unpinSite = useCallback(
    async (index: number) => {
      const { stored, rows } = await loadStorage();
      delete stored.pinned[String(index)];
      await saveStorage(stored, rows);
      refresh();
    },
    [refresh]
  );

  const removeSite = useCallback(
    async (index: number) => {
      const { stored, rows } = await loadStorage();
      const site = state.sites[index];
      if (!site) return;
      stored.removed.push(site.url);
      // Also remove from pinned if it was pinned
      delete stored.pinned[String(index)];
      // Also remove from custom
      stored.custom = stored.custom.filter(
        (c) => normalizeUrl(c.url) !== normalizeUrl(site.url)
      );
      await saveStorage(stored, rows);
      refresh();
    },
    [state.sites, refresh]
  );

  const editSite = useCallback(
    async (index: number, newTitle: string, newUrl: string) => {
      const { stored, rows } = await loadStorage();
      const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
      // Update pinned entry
      stored.pinned[String(index)] = { title: newTitle, url };
      await saveStorage(stored, rows);
      refresh();
    },
    [refresh]
  );

  const addSite = useCallback(
    async (title: string, url: string) => {
      const { stored, rows } = await loadStorage();
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      stored.custom.push({
        url: fullUrl,
        title,
        pinned: false,
      });
      // Remove from removed list if it was there
      stored.removed = stored.removed.filter(
        (r) => normalizeUrl(r) !== normalizeUrl(fullUrl)
      );
      await saveStorage(stored, rows);
      refresh();
    },
    [refresh]
  );

  const moveSite = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const { stored, rows } = await loadStorage();
      const sites = [...state.sites];

      // Swap sites
      const temp = sites[fromIndex];
      sites[fromIndex] = sites[toIndex];
      sites[toIndex] = temp;

      // Update pinned positions: re-pin any pinned sites at their new positions
      const newPinned: StoredData["pinned"] = {};
      for (const [posStr, pinData] of Object.entries(stored.pinned)) {
        const pos = Number(posStr);
        if (pos === fromIndex) {
          newPinned[String(toIndex)] = pinData;
        } else if (pos === toIndex) {
          newPinned[String(fromIndex)] = pinData;
        } else {
          newPinned[posStr] = pinData;
        }
      }
      stored.pinned = newPinned;
      await saveStorage(stored, rows);
      refresh();
    },
    [state.sites, refresh]
  );

  const setRows = useCallback(
    async (rows: number) => {
      const { stored } = await loadStorage();
      await saveStorage(stored, rows);
      refresh();
    },
    [refresh]
  );

  return {
    sites: state.sites,
    rows: state.rows,
    loading: state.loading,
    pinSite,
    unpinSite,
    removeSite,
    editSite,
    addSite,
    moveSite,
    setRows,
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url.toLowerCase();
  }
}
