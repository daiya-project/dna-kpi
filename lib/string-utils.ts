/**
 * String utilities.
 */

/**
 * Trim and return empty string for null/undefined.
 */
export function trim(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Truncate string with ellipsis. No ellipsis if within maxLength.
 */
export function truncate(value: string, maxLength: number, suffix = "…"): string {
  const s = String(value);
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word (simple split on space).
 */
export function capitalizeWords(value: string): string {
  return trim(value)
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Check if string is blank (empty or whitespace only).
 */
export function isBlank(value: string | null | undefined): boolean {
  if (value == null) return true;
  return String(value).trim().length === 0;
}
