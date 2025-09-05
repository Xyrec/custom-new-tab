export function getColumnsCountFromElement(
  el: HTMLElement | null,
  fallback = 8
): number {
  try {
    if (!el) return fallback;
    const computed = window.getComputedStyle(el);
    const template = computed.gridTemplateColumns;
    if (!template) return fallback;
    return template.split(" ").filter(Boolean).length || fallback;
  } catch {
    return fallback;
  }
}
