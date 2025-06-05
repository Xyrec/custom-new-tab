import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy manifest.json to dist folder
fs.copyFileSync(
  path.join(__dirname, "../public/manifest.json"),
  path.join(__dirname, "../dist/manifest.json")
);

// Copy background script
fs.copyFileSync(
  path.join(__dirname, "../public/background.js"),
  path.join(__dirname, "../dist/background.js")
);

// Copy icons to dist folder
const iconsDir = path.join(__dirname, "../public/icons");
if (fs.existsSync(iconsDir)) {
  const distIconsDir = path.join(__dirname, "../dist/icons");
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }
  fs.readdirSync(iconsDir).forEach((file) => {
    fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
  });
}

// Rename _next directory to static
const distDir = path.join(__dirname, "../dist");
const nextDir = path.join(distDir, "_next");
const staticDir = path.join(distDir, "static");

if (fs.existsSync(nextDir)) {
  if (fs.existsSync(staticDir)) {
    fs.rmSync(staticDir, { recursive: true, force: true });
  }
  fs.renameSync(nextDir, staticDir);
}

// Function to calculate SHA-256 hash of a string
function calculateHash(content) {
  return crypto.createHash("sha256").update(content).digest("base64");
}

// Update all references to _next in HTML files and add CSP
const updateFileReferences = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateFileReferences(filePath);
    } else if (file.endsWith(".html")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Replace _next references
      content = content.replace(/\/_next\//g, "/static/");

      // Collect all script hashes
      const scriptHashes = new Set();
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
      let scriptMatch;

      while ((scriptMatch = scriptRegex.exec(content)) !== null) {
        const scriptContent = scriptMatch[1].trim();
        if (scriptContent) {
          const hash = calculateHash(scriptContent);
          scriptHashes.add(hash);
        }
      }

      // Add CSP meta tag with all script hashes
      if (!content.includes("Content-Security-Policy")) {
        const cspHashes = Array.from(scriptHashes)
          .map((hash) => `'sha256-${hash}'`)
          .join(" ");

        content = content.replace(
          "<head>",
          `<head>
            <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'wasm-unsafe-eval' ${cspHashes}; object-src 'self'">`
        );
      }

      // Move all inline scripts to external files
      let scriptIndex = 0;
      content = content.replace(scriptRegex, (match, scriptContent) => {
        if (scriptContent.trim()) {
          const scriptFileName = `inline-script-${scriptIndex}.js`;
          const scriptPath = path.join(distDir, scriptFileName);
          fs.writeFileSync(scriptPath, scriptContent);
          scriptIndex++;
          return `<script src="/${scriptFileName}"></script>`;
        }
        return match;
      });

      fs.writeFileSync(filePath, content);
    }
  });
};

updateFileReferences(distDir);

console.log("Extension build completed successfully!");
