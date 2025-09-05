// Listen for web navigation events
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (details.frameId === 0) {
      // Main frame only
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: () => {
          // Only inject if we're on the new tab page
          if (
            document.location.pathname === "/index.html" ||
            document.location.pathname === "/"
          ) {
            // Add CSP meta tag
            const meta = document.createElement("meta");
            meta.httpEquiv = "Content-Security-Policy";
            meta.content =
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; object-src 'self'";
            document.head.appendChild(meta);
          }
        },
      });
    }
  },
  { url: [{ schemes: ["chrome-extension"] }] },
);
