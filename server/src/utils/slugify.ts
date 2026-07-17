/** Turn a string into a URL-friendly slug, e.g. "Wireless Headphones" -> "wireless-headphones" */
export function slugifyBase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Slug + a short unique suffix, for entities created by end users (products) where collisions are likely. */
export function slugifyUnique(text: string): string {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${slugifyBase(text)}-${suffix}`;
}
