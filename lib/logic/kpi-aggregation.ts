/**
 * KPI aggregation / business logic only. Data comes from lib/api (20-code-main, 01-project-structure-rule).
 * Naming: val_*, _rate, _pct (41-data-structure).
 */

import type { MonthlyKpiRow } from "@/types/app-db.types";

export interface KpiAggregate {
  month: string;
  category: "ads" | "media";
  country: "kr" | "us";
  val_actual_monthly: number;
  val_target_monthly: number | null;
  /** achievement_rate = val_actual / val_target when val_target > 0 */
  achievement_rate?: number;
}

/**
 * Group rows by (month, category, country) and sum val_actual_monthly.
 */
export function aggregateMonthlyKpi(rows: MonthlyKpiRow[]): KpiAggregate[] {
  const map = new Map<string, KpiAggregate>();
  for (const r of rows) {
    const key = `${r.month}|${r.category}|${r.country}`;
    const existing = map.get(key);
    const actual = Number(r.val_actual_monthly ?? r.val_actual_daily ?? 0);
    const target = Number(r.val_target_monthly ?? r.val_target_daily ?? 0);
    if (existing) {
      existing.val_actual_monthly += actual;
      existing.val_target_monthly = (existing.val_target_monthly ?? 0) + target;
    } else {
      map.set(key, {
        month: r.month,
        category: r.category as "ads" | "media",
        country: r.country as "kr" | "us",
        val_actual_monthly: actual,
        val_target_monthly: target,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      a.month.localeCompare(b.month) ||
      a.category.localeCompare(b.category) ||
      a.country.localeCompare(b.country),
  );
}
