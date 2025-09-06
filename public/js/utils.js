import { SETTINGS } from "./settings.js";

export function extractTitle(filename) {
  // Build a regex from the user-configurable tag list
  const tags = SETTINGS.FILENAME_TAGS.join("|");
  const tagRegex = new RegExp(`\\b(${tags})\\b`, "gi");
  return filename
    .replace(/\.[sS]?\d{1,2}[eE]?\d{0,2}.*/g, "") // Remove season/episode info
    .replace(/\b(19|20)\d{2}\b.*/g, "") // Remove year and everything after
    .replace(/[\.\-_\(\)\?]/g, " ")
    .replace(tagRegex, "") // Remove unwanted tags (from settings)
    .trim();
}
