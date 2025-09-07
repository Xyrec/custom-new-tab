interface ParsedBookmark {
  url: string;
  title: string;
}

export const parseFirefoxBookmarks = (
  htmlContent: string,
): ParsedBookmark[] => {
  // Look for complete link elements with both href and title
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*title="([^"]*)"[^>]*>/gi;
  const bookmarks: ParsedBookmark[] = [];
  const processedUrls = new Set<string>();

  let match;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    const title = match[2];

    // Skip if we've already processed this URL or if it's empty
    if (!url || processedUrls.has(url)) {
      continue;
    }

    processedUrls.add(url);

    let finalTitle = title;

    // If title is empty or just whitespace, use domain name as fallback
    if (!finalTitle || finalTitle.trim() === "") {
      try {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        finalTitle = urlObj.hostname.replace("www.", "");
      } catch {
        finalTitle = "Untitled";
      }
    }

    // Skip non-bookmark links like "Customize this page"
    if (finalTitle.toLowerCase().includes("customize")) {
      continue;
    }

    bookmarks.push({ url, title: finalTitle });
  }

  // If we didn't find any matches with the combined regex, fall back to separate parsing
  if (bookmarks.length === 0) {
    const hrefRegex = /href="([^"]*)"[^>]*tabindex/gi;
    const titleRegex = /title="([^"]*)"[^>]*>/gi;
    const urlMatches: string[] = [];
    const titleMatches: string[] = [];

    // Extract all URLs
    while ((match = hrefRegex.exec(htmlContent)) !== null) {
      const url = match[1];
      if (url && !urlMatches.includes(url)) {
        urlMatches.push(url);
      }
    }

    // Extract all titles
    while ((match = titleRegex.exec(htmlContent)) !== null) {
      const title = match[1];
      if (title && !title.toLowerCase().includes("customize")) {
        titleMatches.push(title);
      }
    }

    // Try to pair them by finding nearby occurrences
    const lines = htmlContent.split("\n");
    for (const line of lines) {
      const hrefMatch = line.match(/href="([^"]*)"[^>]*tabindex/i);
      const titleMatch = line.match(/title="([^"]*)"[^>]*>/i);

      if (hrefMatch && titleMatch) {
        const url = hrefMatch[1];
        const title = titleMatch[1];

        if (
          !processedUrls.has(url) &&
          !title.toLowerCase().includes("customize")
        ) {
          processedUrls.add(url);

          let finalTitle = title;
          if (!finalTitle || finalTitle.trim() === "") {
            try {
              const urlObj = new URL(
                url.startsWith("http") ? url : `https://${url}`,
              );
              finalTitle = urlObj.hostname.replace("www.", "");
            } catch {
              finalTitle = "Untitled";
            }
          }

          bookmarks.push({ url, title: finalTitle });
        }
      }
    }
  }

  return bookmarks;
};

export const importBookmarksFromFile = (
  file: File,
  onSuccess: (bookmarks: ParsedBookmark[]) => void,
  onError: (error: string) => void,
): void => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      const parsedBookmarks = parseFirefoxBookmarks(content);

      if (parsedBookmarks.length === 0) {
        onError(
          "No bookmarks found in the file. Please make sure it's a Firefox new tab export.",
        );
        return;
      }

      onSuccess(parsedBookmarks);
    }
  };

  reader.onerror = () => {
    onError("Error reading the file. Please try again.");
  };

  reader.readAsText(file);
};
