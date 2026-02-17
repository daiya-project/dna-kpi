/**
 * Build KPI table sections from monthly rows. 41-data-structure: val_*, _rate.
 * Used by dashboard table; data comes from lib/api (no fetch here).
 */

import type { MonthlyKpiRow } from "@/types/app-db.types";

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Q1",
  "Apr",
  "May",
  "Jun",
  "Q2",
  "YTD",
] as const;

/** Metric row labels for quarterly view (reference: glassmorphism-kpi-dashboard) */
export const quarterlyMetricLabels = [
  "Target",
  "Daily Target",
  "Achievement",
  "Achievement Rate",
  "Daily Achievement",
  "Daily Achievement Rate",
  "Daily Q/Q",
] as const;

export const monthlyMetricLabels = [
  "Target",
  "Daily Target",
  "Achievement",
  "Achievement Rate",
  "Daily Achievement",
  "Daily Achievement Rate",
  "Daily M/M",
] as const;

export type MonthKey =
  | "jan"
  | "feb"
  | "mar"
  | "apr"
  | "may"
  | "jun";

export interface KpiTableRow {
  metric: string;
  jan: number;
  feb: number;
  mar: number;
  q1: number;
  apr: number;
  may: number;
  jun: number;
  q2: number;
  ytd: number;
  isSubtotal?: boolean;
  /** achievement_rate (e.g. val_actual/val_target); optional */
  achievement_rate_pct?: number;
}

/** Per-quarter block: 3 month values + quarter total, for collapsible UI */
export interface QuarterMetricRow {
  metric: string;
  values: number[]; // [m1, m2, m3, quarterTotal] or [m4, m5, m6, quarterTotal]
  isSubtotal?: boolean;
  isRate?: boolean; // format as %
}

export interface QuarterBlock {
  label: "Q1" | "Q2";
  monthLabels: readonly string[];
  rows: QuarterMetricRow[];
  totalTarget: number;
  totalAchievement: number;
  achievementRatePct: number;
}

export interface KpiTableSection {
  category: "ads" | "media";
  rows: KpiTableRow[];
  /** Quarter blocks for collapsible view (Q1, Q2) */
  quarters: QuarterBlock[];
}

/**
 * Pivot MonthlyKpiRow[] by year and category into sections with monthly/Q1/Q2/YTD.
 * Uses system date for current year when year not provided (31-term-main).
 * Also builds quarter blocks (quarters[]) for collapsible table UI and metric labels.
 */
export function buildKpiTableSections(
  rows: MonthlyKpiRow[],
  year?: number,
): KpiTableSection[] {
  const y = year ?? new Date().getFullYear();
  const monthKeys: MonthKey[] = ["jan", "feb", "mar", "apr", "may", "jun"];
  const sections: KpiTableSection[] = [];

  for (const cat of ["ads", "media"] as const) {
    const byMonth: Record<MonthKey, number> = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
    };
    const byMonthTarget: Record<MonthKey, number> = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
    };
    const byMonthDailyActual: Record<MonthKey, number> = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
    };
    const byMonthDailyTarget: Record<MonthKey, number> = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
    };

    for (const r of rows) {
      if (r.category !== cat) continue;
      const monthStr = r.month.length >= 7 ? r.month.slice(5, 7) : r.month.slice(0, 2);
      const m = parseInt(monthStr, 10);
      if (m >= 1 && m <= 6) {
        const key = monthKeys[m - 1];
        byMonth[key] += Number(r.val_actual_monthly ?? r.val_actual_daily ?? 0);
        byMonthTarget[key] += Number(r.val_target_monthly ?? r.val_target_daily ?? 0);
        byMonthDailyActual[key] += Number(r.val_actual_daily ?? 0);
        byMonthDailyTarget[key] += Number(r.val_target_daily ?? 0);
      }
    }

    const q1Actual = byMonth.jan + byMonth.feb + byMonth.mar;
    const q1Target = byMonthTarget.jan + byMonthTarget.feb + byMonthTarget.mar;
    const q2Actual = byMonth.apr + byMonth.may + byMonth.jun;
    const q2Target = byMonthTarget.apr + byMonthTarget.may + byMonthTarget.jun;
    const q1 = q1Actual;
    const q2 = q2Actual;
    const ytd = q1 + q2;

    const actualRow: KpiTableRow = {
      metric: "Achieved Revenue",
      jan: byMonth.jan,
      feb: byMonth.feb,
      mar: byMonth.mar,
      q1,
      apr: byMonth.apr,
      may: byMonth.may,
      jun: byMonth.jun,
      q2,
      ytd,
    };

    const goalRow: KpiTableRow = {
      metric: "Goal Revenue",
      jan: byMonthTarget.jan,
      feb: byMonthTarget.feb,
      mar: byMonthTarget.mar,
      q1: q1Target,
      apr: byMonthTarget.apr,
      may: byMonthTarget.may,
      jun: byMonthTarget.jun,
      q2: q2Target,
      ytd: q1Target + q2Target,
    };

    const rate = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 1000) / 10 : 0);
    const rateRow: KpiTableRow = {
      metric: "Achievement Rate",
      jan: rate(byMonth.jan, byMonthTarget.jan),
      feb: rate(byMonth.feb, byMonthTarget.feb),
      mar: rate(byMonth.mar, byMonthTarget.mar),
      q1: rate(q1Actual, q1Target),
      apr: rate(byMonth.apr, byMonthTarget.apr),
      may: rate(byMonth.may, byMonthTarget.may),
      jun: rate(byMonth.jun, byMonthTarget.jun),
      q2: rate(q2Actual, q2Target),
      ytd: rate(q1Actual + q2Actual, q1Target + q2Target),
      achievement_rate_pct: rate(q1Actual + q2Actual, q1Target + q2Target),
    };

    const subtotalRow: KpiTableRow = {
      ...actualRow,
      metric: "Subtotal",
      isSubtotal: true,
    };

    const q1DailyActual = (byMonthDailyActual.jan + byMonthDailyActual.feb + byMonthDailyActual.mar) / 3;
    const q1DailyTarget = (byMonthDailyTarget.jan + byMonthDailyTarget.feb + byMonthDailyTarget.mar) / 3;
    const q2DailyActual = (byMonthDailyActual.apr + byMonthDailyActual.may + byMonthDailyActual.jun) / 3;
    const q2DailyTarget = (byMonthDailyTarget.apr + byMonthDailyTarget.may + byMonthDailyTarget.jun) / 3;

    const quarterBlocks: QuarterBlock[] = [
      {
        label: "Q1",
        monthLabels: ["Jan", "Feb", "Mar"],
        totalTarget: q1Target,
        totalAchievement: q1Actual,
        achievementRatePct: rate(q1Actual, q1Target),
        rows: [
          {
            metric: "Target",
            values: [byMonthTarget.jan, byMonthTarget.feb, byMonthTarget.mar, q1Target],
          },
          {
            metric: "Daily Target",
            values: [
              Math.round(byMonthDailyTarget.jan) || 0,
              Math.round(byMonthDailyTarget.feb) || 0,
              Math.round(byMonthDailyTarget.mar) || 0,
              Math.round(q1DailyTarget) || 0,
            ],
          },
          {
            metric: "Achievement",
            values: [byMonth.jan, byMonth.feb, byMonth.mar, q1Actual],
          },
          {
            metric: "Achievement Rate",
            values: [
              rate(byMonth.jan, byMonthTarget.jan),
              rate(byMonth.feb, byMonthTarget.feb),
              rate(byMonth.mar, byMonthTarget.mar),
              rate(q1Actual, q1Target),
            ],
            isRate: true,
          },
          {
            metric: "Daily Achievement",
            values: [
              Math.round(byMonthDailyActual.jan) || 0,
              Math.round(byMonthDailyActual.feb) || 0,
              Math.round(byMonthDailyActual.mar) || 0,
              Math.round(q1DailyActual) || 0,
            ],
          },
          {
            metric: "Daily Achievement Rate",
            values: [
              rate(byMonthDailyActual.jan, byMonthDailyTarget.jan),
              rate(byMonthDailyActual.feb, byMonthDailyTarget.feb),
              rate(byMonthDailyActual.mar, byMonthDailyTarget.mar),
              rate(q1DailyActual, q1DailyTarget),
            ],
            isRate: true,
          },
          { metric: "Daily Q/Q", values: [0, 0, 0, 0], isRate: true },
        ],
      },
      {
        label: "Q2",
        monthLabels: ["Apr", "May", "Jun"],
        totalTarget: q2Target,
        totalAchievement: q2Actual,
        achievementRatePct: rate(q2Actual, q2Target),
        rows: [
          {
            metric: "Target",
            values: [byMonthTarget.apr, byMonthTarget.may, byMonthTarget.jun, q2Target],
          },
          {
            metric: "Daily Target",
            values: [
              Math.round(byMonthDailyTarget.apr) || 0,
              Math.round(byMonthDailyTarget.may) || 0,
              Math.round(byMonthDailyTarget.jun) || 0,
              Math.round((byMonthDailyTarget.apr + byMonthDailyTarget.may + byMonthDailyTarget.jun) / 3) || 0,
            ],
          },
          {
            metric: "Achievement",
            values: [byMonth.apr, byMonth.may, byMonth.jun, q2Actual],
          },
          {
            metric: "Achievement Rate",
            values: [
              rate(byMonth.apr, byMonthTarget.apr),
              rate(byMonth.may, byMonthTarget.may),
              rate(byMonth.jun, byMonthTarget.jun),
              rate(q2Actual, q2Target),
            ],
            isRate: true,
          },
          {
            metric: "Daily Achievement",
            values: [
              Math.round(byMonthDailyActual.apr) || 0,
              Math.round(byMonthDailyActual.may) || 0,
              Math.round(byMonthDailyActual.jun) || 0,
              Math.round(q2DailyActual) || 0,
            ],
          },
          {
            metric: "Daily Achievement Rate",
            values: [
              rate(byMonthDailyActual.apr, byMonthDailyTarget.apr),
              rate(byMonthDailyActual.may, byMonthDailyTarget.may),
              rate(byMonthDailyActual.jun, byMonthDailyTarget.jun),
              rate(q2DailyActual, q2DailyTarget),
            ],
            isRate: true,
          },
          { metric: "Daily Q/Q", values: [0, 0, 0, 0], isRate: true },
        ],
      },
    ];

    sections.push({
      category: cat,
      rows: [goalRow, actualRow, rateRow, subtotalRow],
      quarters: quarterBlocks,
    });
  }

  return sections;
}

// --- Monthly column table (YYYY-MM, oldest to newest, no quarter totals) ---

/** Normalize month string to YYYY-MM (from YYYY-MM or YYYY-MM-DD). */
function toYearMonth(month: string): string {
  if (month.length >= 7) return month.slice(0, 7);
  return month;
}

/** Unique months from rows, sorted ascending (oldest first). */
export function getMonthsFromRows(rows: MonthlyKpiRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    set.add(toYearMonth(r.month));
  }
  return Array.from(set).sort();
}

/** All 12 months for a year (YYYY-01 .. YYYY-12). Use for fixed year view. */
export function getMonthsForYear(year: number): string[] {
  const y = String(year);
  return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(
    (m) => `${y}-${m}`,
  );
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
 * If year is provided, columns are that year's 12 months (YYYY-01 .. YYYY-12); missing data shows as 0.
 * If year is omitted, columns are derived from rows only (oldest to newest).
 */
export function buildMonthlyTableSections(
  rows: MonthlyKpiRow[],
  year?: number,
): { months: string[]; sections: MonthlyTableSection[] } {
  const months =
    year !== undefined ? getMonthsForYear(year) : getMonthsFromRows(rows);
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

    const rate = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 1000) / 10 : 0);
    const values = (fn: (a: MonthAgg) => number) =>
      months.map((ym) => fn(byMonth.get(ym) ?? emptyAgg()));

    const targetValues = values((a) => a.target);
    const actualValues = values((a) => a.actual);
    const dailyTargetValues = values((a) => Math.round(a.dailyTarget) || 0);
    const dailyActualValues = values((a) => Math.round(a.dailyActual) || 0);
    const rateValues = months.map((ym) => {
      const a = byMonth.get(ym) ?? emptyAgg();
      return rate(a.actual, a.target);
    });
    const dailyRateValues = months.map((ym) => {
      const a = byMonth.get(ym) ?? emptyAgg();
      return rate(a.dailyActual, a.dailyTarget);
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

/** YTD total per category for summary cards */
export function buildSummaryYtdByCategory(
  rows: MonthlyKpiRow[],
  year?: number,
): Record<string, number> {
  const y = year ?? new Date().getFullYear();
  const out: Record<string, number> = { cm: 0, media: 0, ads: 0, "media-fee": 0 };

  for (const r of rows) {
    const ym = r.month.slice(0, 4);
    if (ym !== String(y)) continue;
    const val = Number(r.val_actual_monthly ?? r.val_actual_daily ?? 0);
    if (r.category === "ads") out.ads += val;
    if (r.category === "media") out.media += val;
  }

  out.cm = out.media + out.ads;
  return out;
}
