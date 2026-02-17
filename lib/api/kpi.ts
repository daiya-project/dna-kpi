/**
 * KPI data access only. No business logic here (01-project-structure-rule, 20-code-main).
 * Uses dna_kpi schema; region (dashboard) is mapped to country (API) via regionToCountry.
 */

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { MonthlyKpiRow, MonthlyKpiFilters } from "@/types/app-db.types";
import { regionToCountry } from "@/types/app-db.types";

type DnaKpiSchema = Database["dna_kpi"];
type MonthlyKpiRowDb = DnaKpiSchema["Tables"]["monthly_kpi"]["Row"];

/** Query chain for dna_kpi.monthly_kpi (Supabase .schema() not fully typed for custom schemas) */
interface MonthlyKpiQueryChain {
  eq(column: string, value: string): MonthlyKpiQueryChain;
  gte(column: string, value: string): MonthlyKpiQueryChain;
  lte(column: string, value: string): MonthlyKpiQueryChain;
  then(
    onfulfilled?: (r: { data: MonthlyKpiRowDb[] | null; error: { message: string } | null }) => unknown,
  ): Promise<{ data: MonthlyKpiRowDb[] | null; error: { message: string } | null }>;
}

type DnaKpiClient = {
  schema: (name: "dna_kpi") => {
    from: (table: "monthly_kpi") => {
      select: (columns: string) => {
        order: (column: string, opts: { ascending: boolean }) => MonthlyKpiQueryChain;
      };
    };
  };
};

export async function fetchMonthlyKpi(
  filters?: MonthlyKpiFilters,
): Promise<MonthlyKpiRow[]> {
  const supabase = await createClient();
  const client = supabase as unknown as DnaKpiClient;
  let q = client
    .schema("dna_kpi")
    .from("monthly_kpi")
    .select(
      "id, month, category, country, val_actual_daily, val_actual_monthly, val_target_daily, val_target_monthly, created_at, updated_at",
    )
    .order("month", { ascending: true });

  const country = filters?.region !== undefined ? regionToCountry(filters.region) : filters?.country;
  if (country) {
    q = q.eq("country", country);
  }
  if (filters?.category) {
    q = q.eq("category", filters.category);
  }
  if (filters?.month_from) {
    q = q.gte("month", filters.month_from);
  }
  if (filters?.month_to) {
    q = q.lte("month", filters.month_to);
  }

  const { data, error } = await q;
  if (error) {
    throw new Error(`KPI fetch failed: ${error.message}`);
  }
  return (data ?? []) as MonthlyKpiRow[];
}
