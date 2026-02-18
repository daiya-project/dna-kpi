/**
 * Number formatting and parsing utilities.
 */

const DEFAULT_LOCALE = "en-US";

/**
 * Format a number with locale (e.g. 1234.5 → "1,234.5").
 * Returns "—" for NaN.
 */
export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions,
): string {
  const n = Number(num);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(DEFAULT_LOCALE, options);
}

/**
 * Format as percentage (e.g. 84.4 → "84.4%").
 * Returns "—" for NaN.
 */
export function formatPercent(num: number, decimals = 1): string {
  const n = Number(num);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

/**
 * Compute value/total as percentage (0–100), rounded to given decimals.
 * Returns 0 when total ≤ 0. Useful for achievement rate, conversion rate, etc.
 */
export function percentRate(
  value: number,
  total: number,
  decimals = 1,
): number {
  if (total <= 0 || !Number.isFinite(total)) return 0;
  const p = (Number(value) / total) * 100;
  const factor = 10 ** decimals;
  return Math.round(p * factor) / factor;
}

/**
 * Parse a value to number. Returns NaN if invalid.
 */
export function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "number") return Number.isNaN(value) ? Number.NaN : value;
  const n = Number(String(value).trim());
  return Number.isNaN(n) ? Number.NaN : n;
}

/**
 * Safe number for display: returns formatted string or fallback (default "—").
 */
export function formatNumberOrFallback(
  value: string | number | null | undefined,
  fallback = "—",
): string {
  const n = parseNumber(value);
  if (Number.isNaN(n)) return fallback;
  return formatNumber(n);
}

/**
 * Monthly total → daily value (rounded integer).
 * Use with getDaysInMonth(month) from date-utils for KPI table edit.
 * Returns 0 when daysInMonth ≤ 0 or inputs are invalid.
 */
export function monthlyToDaily(
  monthly: number,
  daysInMonth: number,
): number {
  const m = Number(monthly);
  const d = Number(daysInMonth);
  if (Number.isNaN(m) || Number.isNaN(d) || d <= 0) return 0;
  return Math.round(m / d);
}

/**
 * Daily value × days in month → monthly total (integer).
 * Use with getDaysInMonth(month) from date-utils for KPI table edit.
 */
export function dailyToMonthly(
  daily: number,
  daysInMonth: number,
): number {
  const day = Number(daily);
  const d = Number(daysInMonth);
  if (Number.isNaN(day) || Number.isNaN(d)) return 0;
  return Math.round(day * d);
}

/**
 * 정수를 N개로 나눌때 나머지 배분법(Distribute Remainder)을 사용하여 소수점 없이 나누어지도록 배분합니다.
 * 남는 나머지(짜투리)는 앞쪽 요소들에 1씩 분배합니다.
 * @param total 나누고 싶은 총액 (예: 10)
 * @param count 나눌 개수 (예: 3)
 * @returns 합계가 total과 일치하는 정수 배열 (예: [4, 3, 3])
 */
export function distributeInteger(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const remainder = total % count;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const value = i < remainder ? base + 1 : base;
    result.push(value);
  }
  return result;
}
