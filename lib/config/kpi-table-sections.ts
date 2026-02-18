/**
 * KPI table section/block display config.
 * Controls which blocks (QUARTERLY/MONTHLY) and which metric rows are shown per section.
 * Categories (identity, style) stay in categories.ts / dashboard-sections; this file is display rules only.
 */

/** Block type in the table. */
export type TableBlockType = "quarterly" | "monthly";

/** Canonical metric IDs (snake_case). Same set for both blocks; visibility per block via config. */
export const METRIC_IDS = [
  "target",
  "achievement",
  "achievement_rate",
  "daily_target",
  "daily_achievement",
  "daily_achievement_rate",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

/** Display label for each metric (row header in table). */
export const METRIC_DISPLAY_LABELS: Record<MetricId, string> = {
  target: "Target",
  achievement: "Achievement",
  achievement_rate: "Achievement Rate",
  daily_target: "Daily Target",
  daily_achievement: "Daily Achievement",
  daily_achievement_rate: "Daily Achievement Rate",
};

/** Section-level table display config (which blocks/rows to show). Not styling. */
export interface SectionTableDisplayConfig {
  /** Section (category) id; same key as getCategoryConfig / getDashboardSectionConfig. */
  sectionId: string;
  /** Show QUARTERLY block. Default true. */
  showQuarterly?: boolean;
  /** Show MONTHLY block. Default true. */
  showMonthly?: boolean;
  /** Metric IDs to show in QUARTERLY block only. Order preserved per METRIC_IDS. Empty = block not rendered. */
  visibleMetricsQuarterly?: readonly string[];
  /** Metric IDs to show in MONTHLY block only. Order preserved per METRIC_IDS. Empty = block not rendered. */
  visibleMetricsMonthly?: readonly string[];
}

const SECTION_TABLE_DISPLAY_CONFIGS: SectionTableDisplayConfig[] = [
  {
    sectionId: "cm",
    showQuarterly: true,
    showMonthly: true,
    visibleMetricsQuarterly: ["target", "achievement", "achievement_rate"],
    visibleMetricsMonthly: [
      "target",
      "achievement",
      "achievement_rate",
      "daily_target",
      "daily_achievement",
      "daily_achievement_rate",
    ],
  },
  {
    sectionId: "fr",
    showQuarterly: false,
    showMonthly: true,
  },
];

export function getSectionTableDisplayConfig(
  sectionId: string,
): SectionTableDisplayConfig | undefined {
  return SECTION_TABLE_DISPLAY_CONFIGS.find((c) => c.sectionId === sectionId);
}

/**
 * Filter and order rows by visible metric IDs.
 * - undefined/absent: return all rows in METRIC_IDS order.
 * - empty array: return [] (block should not render rows).
 * - non-empty: return only matching rows in METRIC_IDS order.
 */
export function filterAndOrderMetricRows<T extends { metric: string }>(
  rows: T[],
  visibleIds: readonly string[] | undefined,
): T[] {
  if (visibleIds !== undefined && visibleIds.length === 0) return [];
  const order = [...METRIC_IDS];
  const byId = new Map(rows.map((r) => [r.metric, r]));
  if (visibleIds === undefined || visibleIds.length === 0) {
    return order.map((id) => byId.get(id)).filter((r): r is T => r != null);
  }
  const idSet = new Set(visibleIds);
  return order.filter((id) => idSet.has(id)).map((id) => byId.get(id)).filter((r): r is T => r != null);
}
