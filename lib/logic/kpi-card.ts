/**
 * YTD (year-to-date) summary by category for dashboard cards.
 * Uses date-utils for year handling; data comes from lib/api (no fetch here).
 */

import type { MonthlyKpiRow } from "@/types/app-db.types";
import { getCurrentYear, getYearFromMonth } from "@/lib/date-utils";

/** YTD total per category for summary cards. */
export function buildSummaryYtdByCategory(
  rows: MonthlyKpiRow[],
  year?: number,
): Record<string, number> {
  const y = year ?? getCurrentYear();
  const out: Record<string, number> = { cm: 0, media: 0, ads: 0, "media-fee": 0 };

  for (const r of rows) {
    if (getYearFromMonth(r.month) !== y) continue;
    const val = Number(r.val_actual_monthly ?? r.val_actual_daily ?? 0);
    if (r.category === "ads") out.ads += val;
    if (r.category === "media") out.media += val;
  }

  out.cm = out.media + out.ads;
  return out;
}
