/** Read the actual column count from a CSS grid element's computed style. */
export function getColumnsCountFromElement(el: HTMLElement | null, fallback = 8): number {
  try {
    if (!el) return fallback;
    const template = window.getComputedStyle(el).gridTemplateColumns;
    if (!template) return fallback;
    return template.split(" ").filter(Boolean).length || fallback;
  } catch {
    return fallback;
  }
}
