/**
 * Build KPI table sections from monthly rows. 41-data-structure: val_*, _rate.
 * Used by dashboard table; data comes from lib/api (no fetch here).
 * Row metric IDs match METRIC_IDS in lib/config/kpi-table-sections.ts.
 */

import type { MonthlyKpiRow } from "@/types/app-db.types";
import { METRIC_IDS } from "@/lib/config/kpi-table-sections";
import {
  getMonthsForYear,
  getQuarterFromMonth,
  getYearsFromMonthStrings,
  isLastMonthOfQuarter,
  toYearMonth,
} from "@/lib/date-utils";
import { percentRate } from "@/lib/number-utils";

/**
 * Build month → row id map for one section (category) and country (kr/us).
 * Used when region is kr or us so each cell can resolve id for update or null for insert.
 * @param rows Raw monthly_kpi rows (already filtered by country at fetch)
 * @param category Section category (e.g. "ads", "media")
 * @param months All displayed months (YYYY-MM)
 */
export function buildMonthToRowIdMap(
  rows: MonthlyKpiRow[],
  category: string,
  months: string[],
): Record<string, number | null> {
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    if (r.category !== category) continue;
    const ym = toYearMonth(r.month);
    byMonth.set(ym, r.id);
  }
  const out: Record<string, number | null> = {};
  for (const ym of months) {
    out[ym] = byMonth.get(ym) ?? null;
  }
  return out;
}

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
  /** 월(YYYY-MM) → DB row id. kr/us 리전일 때 셀 편집용; 없으면 null(insert). */
  monthToRowId?: Record<string, number | null>;
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

/** Default metric IDs used for building rows (first 6). Extra IDs (daily_qq, etc.) reserved for future. */
const CORE_METRIC_IDS = METRIC_IDS.slice(0, 6);

/** Same metric row structure as buildMonthlyTableSections, but values are zeros. For placeholder sections. */
export function createEmptySection(
  sectionId: string,
  months: string[],
): MonthlyTableSection {
  const zeros = months.map(() => 0);
  return {
    category: sectionId,
    rows: CORE_METRIC_IDS.map((id) => ({
      metric: id,
      values: [...zeros],
      isRate: id === "actual_rate" || id === "daily_actual_rate",
    })),
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
        { metric: CORE_METRIC_IDS[0]!, values: targetValues },
        { metric: CORE_METRIC_IDS[1]!, values: actualValues },
        { metric: CORE_METRIC_IDS[2]!, values: rateValues, isRate: true },
        { metric: CORE_METRIC_IDS[3]!, values: dailyTargetValues },
        { metric: CORE_METRIC_IDS[4]!, values: dailyActualValues },
        { metric: CORE_METRIC_IDS[5]!, values: dailyRateValues, isRate: true },
      ],
    });
  }

  return { months, sections };
}
