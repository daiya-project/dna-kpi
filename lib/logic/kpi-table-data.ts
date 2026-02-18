/**
 * Build KPI table sections from monthly rows. 41-data-structure: val_*, _rate.
 * Used by dashboard table; data comes from lib/api (no fetch here).
 */

import type { MonthlyKpiRow } from "@/types/app-db.types";
import {
  getMonthsForYear,
  getQuarterFromMonth,
  getYearsFromMonthStrings,
  isLastMonthOfQuarter,
  toYearMonth,
} from "@/lib/date-utils";
import { percentRate } from "@/lib/number-utils";

// --- Monthly column table (YYYY-MM, oldest to newest, with Q1/Q2/Q3/Q4/Year per year) ---

/** Unique years from rows, sorted ascending. Delegates to date-utils. */
export function getYearsFromRows(rows: MonthlyKpiRow[]): number[] {
  return getYearsFromMonthStrings(rows.map((r) => toYearMonth(r.month)));
}

/**
 * All months for every year present in data: 2024-01..2024-12, 2025-01..2025-12, ...
 * Use when table should show full years with Q1/Q2/Q3/Q4 and year total per year.
 */
export function getMonthsForAllYearsInRows(rows: MonthlyKpiRow[]): string[] {
  const years = getYearsFromRows(rows);
  return years.flatMap((y) => getMonthsForYear(y));
}

/** One metric row for monthly table: values[i] = value for months[i]. */
export interface MonthlyMetricRow {
  metric: string;
  values: number[];
  isRate?: boolean;
}

/** Section for monthly table: category (section id) + rows with one value per month. */
export interface MonthlyTableSection {
  /** Section id (e.g. cm, fr, ads, media, mfr, apc, scr). */
  category: string;
  rows: MonthlyMetricRow[];
}

/** Display column: either a month (YYYY-MM) or a summary (Q1/Q2/Q3/Q4/Year). */
export type DisplayColumn =
  | { key: string; type: "month"; ym: string }
  | { key: string; type: "summary"; label: string; quarterId?: string };

/**
 * Build column list with summary columns injected.
 * After Mar (-03) → Q1 Total; after Jun (-06) → Q2 Total;
 * after Sep (-09) → Q3 Total; after Dec (-12) → Q4 Total, Year Total.
 */
export function buildDisplayColumns(months: string[]): DisplayColumn[] {
  const out: DisplayColumn[] = [];
  for (const ym of months) {
    out.push({ key: ym, type: "month", ym });
    const mm = ym.slice(5, 7);
    const quarter = getQuarterFromMonth(ym);
    if (quarter && isLastMonthOfQuarter(mm)) {
      const label = `Q${quarter.slice(1)} Total`;
      out.push({ key: `${ym}-${quarter}`, type: "summary", label, quarterId: quarter });
    }
    if (mm === "12") {
      const y = ym.slice(0, 4);
      out.push({ key: `${y}-year`, type: "summary", label: "Year Total" });
    }
  }
  return out;
}

/** Same metric row structure as buildMonthlyTableSections, but values are zeros. For placeholder sections. */
export function createEmptySection(
  sectionId: string,
  months: string[],
): MonthlyTableSection {
  const zeros = months.map(() => 0);
  return {
    category: sectionId,
    rows: [
      { metric: "Target", values: [...zeros] },
      { metric: "Daily Target", values: [...zeros] },
      { metric: "Achievement", values: [...zeros] },
      { metric: "Achievement Rate", values: [...zeros], isRate: true },
      { metric: "Daily Achievement", values: [...zeros] },
      { metric: "Daily Achievement Rate", values: [...zeros], isRate: true },
    ],
  };
}

/**
 * Build table data with one column per month (YYYY-MM).
 * - If year is provided: that year only (12 months); missing data shows as 0.
 * - If year is omitted: all years present in data, each year full 12 months in order
 *   (2024-01..2024-12, 2025-01..2025-12, ...). Use with buildDisplayColumns for
 *   [1,2,3월,Q1, 4,5,6월,Q2, 7,8,9월,Q3, 10,11,12월,Q4, 연도총합] per year.
 */
export function buildMonthlyTableSections(
  rows: MonthlyKpiRow[],
  year?: number,
): { months: string[]; sections: MonthlyTableSection[] } {
  const months =
    year !== undefined ? getMonthsForYear(year)
      : getMonthsForAllYearsInRows(rows);
  const sections: MonthlyTableSection[] = [];

  type MonthAgg = { actual: number; target: number; dailyActual: number; dailyTarget: number };
  const emptyAgg = (): MonthAgg => ({ actual: 0, target: 0, dailyActual: 0, dailyTarget: 0 });

  for (const cat of ["ads", "media"] as const) {
    const byMonth = new Map<string, MonthAgg>();

    for (const r of rows) {
      if (r.category !== cat) continue;
      const ym = toYearMonth(r.month);
      const agg = byMonth.get(ym) ?? emptyAgg();
      agg.actual += Number(r.val_actual_monthly ?? r.val_actual_daily ?? 0);
      agg.target += Number(r.val_target_monthly ?? r.val_target_daily ?? 0);
      agg.dailyActual += Number(r.val_actual_daily ?? 0);
      agg.dailyTarget += Number(r.val_target_daily ?? 0);
      byMonth.set(ym, agg);
    }

    const values = (fn: (a: MonthAgg) => number) =>
      months.map((ym) => fn(byMonth.get(ym) ?? emptyAgg()));

    const targetValues = values((a) => a.target);
    const actualValues = values((a) => a.actual);
    const dailyTargetValues = values((a) => Math.round(a.dailyTarget) || 0);
    const dailyActualValues = values((a) => Math.round(a.dailyActual) || 0);
    const rateValues = months.map((ym) => {
      const a = byMonth.get(ym) ?? emptyAgg();
      return percentRate(a.actual, a.target);
    });
    const dailyRateValues = months.map((ym) => {
      const a = byMonth.get(ym) ?? emptyAgg();
      return percentRate(a.dailyActual, a.dailyTarget);
    });

    sections.push({
      category: cat,
      rows: [
        { metric: "Target", values: targetValues },
        { metric: "Daily Target", values: dailyTargetValues },
        { metric: "Achievement", values: actualValues },
        { metric: "Achievement Rate", values: rateValues, isRate: true },
        { metric: "Daily Achievement", values: dailyActualValues },
        { metric: "Daily Achievement Rate", values: dailyRateValues, isRate: true },
      ],
    });
  }

  return { months, sections };
}
