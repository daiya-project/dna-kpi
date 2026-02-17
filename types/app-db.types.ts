/**
 * App-level re-exports and types for DB tables/views used by the app.
 * Source: Supabase schema `dna_kpi`. Run `npm run update-types` to refresh from DB.
 */

import type { Database } from "./database.types";

export type { Database };

/** dna_kpi.monthly_kpi row (41-data-structure: month, category, country, val_*_monthly) */
export interface MonthlyKpiRow {
  id: number;
  month: string; // YYYY-MM or YYYY-MM-DD
  category: string;
  country: string;
  val_actual_daily: number | null;
  val_actual_monthly: number | null;
  val_target_daily: number | null;
  val_target_monthly: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Insert type for monthly_kpi (e.g. upsert) */
export type MonthlyKpiInsert = Omit<
  MonthlyKpiRow,
  "id" | "created_at" | "updated_at"
> & {
  created_at?: string | null;
  updated_at?: string | null;
};

/** Maps dashboard region to API country filter. "summary" = no filter. */
export function regionToCountry(
  region: "summary" | "kr" | "us",
): "kr" | "us" | undefined {
  return region === "kr" || region === "us" ? region : undefined;
}

/** Filters for KPI queries. Use region (URL/dashboard) or country (API) for geo filter. */
export interface MonthlyKpiFilters {
  /** Dashboard region: summary = all, kr/us = filter by country */
  region?: "summary" | "kr" | "us";
  country?: "kr" | "us";
  category?: "ads" | "media";
  month_from?: string; // YYYY-MM or YYYY-MM-DD
  month_to?: string; // YYYY-MM or YYYY-MM-DD
}
