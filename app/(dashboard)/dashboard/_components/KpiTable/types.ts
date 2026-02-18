/**
 * Types for KPI table cell edit (inline edit mode).
 * Identity and draft; state lives in KpiTable.
 */

/** Which metric pair is being edited: target (Target + Daily Target) or actual (Achievement + Daily Achievement). */
export type KpiEditField = "target" | "actual";

/**
 * Identity of the cell(s) being edited. One context = one month + one category + one field (monthly + daily pair).
 */
export interface KpiCellEditContext {
  /** DB row id if exists; null for insert (e.g. future month). */
  id: number | null;
  month: string;
  category: string;
  country: string;
  field: KpiEditField;
}

/** Draft values for the monthly/daily pair. */
export interface KpiEditDraft {
  monthly: number;
  daily: number;
}

/** Display label for edit field (Target vs Achievement). */
export function getMetricLabel(field: KpiEditField): string {
  return field === "target" ? "Target" : "Achievement";
}
