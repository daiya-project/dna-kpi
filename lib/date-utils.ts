/**
 * Date utilities aligned with project date terms (31-term-main).
 * Prefer YYYY-MM-DD for internal/API; use system date for today/current month.
 */

/** Today as YYYY-MM-DD (system date). */
export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Current month as YYYY-MM (system date). */
export function getCurrentMonth(): string {
  return getToday().slice(0, 7);
}

/** Current year (system date). */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Normalize month string to YYYY-MM (from YYYY-MM or YYYY-MM-DD).
 */
export function toYearMonth(month: string): string {
  if (month.length >= 7) return month.slice(0, 7);
  return month;
}

/**
 * Extract year from month string (YYYY-MM or YYYY-MM-DD).
 */
export function getYearFromMonth(month: string): number {
  const ym = toYearMonth(month);
  return ym.length >= 4 ? parseInt(ym.slice(0, 4), 10) : NaN;
}

/**
 * Unique years from month strings (YYYY-MM or YYYY-MM-DD), sorted ascending.
 */
export function getYearsFromMonthStrings(monthStrings: string[]): number[] {
  const set = new Set<number>();
  for (const s of monthStrings) {
    const y = getYearFromMonth(s);
    if (Number.isFinite(y)) set.add(y);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/** All 12 months for a year (YYYY-01 .. YYYY-12). Use for fixed year view. */
export function getMonthsForYear(year: number): string[] {
  const y = String(year);
  return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(
    (m) => `${y}-${m}`,
  );
}

// --- Month–quarter mapping ---

/** Quarter IDs in order (q1 .. q4). */
export const QUARTER_IDS = ["q1", "q2", "q3", "q4"] as const;

/** Month (MM) to quarter ID. 01–03 → q1, 04–06 → q2, 07–09 → q3, 10–12 → q4. */
export const MONTH_TO_QUARTER: Record<string, (typeof QUARTER_IDS)[number]> = {
  "01": "q1", "02": "q1", "03": "q1",
  "04": "q2", "05": "q2", "06": "q2",
  "07": "q3", "08": "q3", "09": "q3",
  "10": "q4", "11": "q4", "12": "q4",
};

/**
 * Quarter ID for a given year-month (YYYY-MM or YYYY-MM-DD). Returns null if invalid.
 */
export function getQuarterFromMonth(ym: string): (typeof QUARTER_IDS)[number] | null {
  const mm = toYearMonth(ym).slice(5, 7);
  return MONTH_TO_QUARTER[mm] ?? null;
}

/** Last month (MM) of each quarter: after this month the summary column (Q1 Total, etc.) is shown. */
export const LAST_MONTH_OF_QUARTER = ["03", "06", "09", "12"] as const;

/** True when month string (MM) is the last month of its quarter. */
export function isLastMonthOfQuarter(mm: string): boolean {
  return (LAST_MONTH_OF_QUARTER as readonly string[]).includes(mm);
}

/**
 * Format a Date or ISO string to YYYY-MM-DD.
 */
export function toYYYYMMDD(date: Date | string): string {
  if (typeof date === "string") {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Normalize user/CSV input to YYYY-MM-DD when possible.
 * Returns empty string if invalid.
 */
export function normalizeToYYYYMMDD(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
