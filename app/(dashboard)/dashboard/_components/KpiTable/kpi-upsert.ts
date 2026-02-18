"use server";

/**
 * Server Action: upsert monthly_kpi (id 있으면 update, 없으면 insert).
 * Used by KPI table cell edit. RLS on dna_kpi.monthly_kpi must allow SELECT/INSERT/UPDATE.
 */

import { toFirstDayOfMonth } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import type { MonthlyKpiUpdatePayload } from "@/types/app-db.types";

export type KpiUpsertResult = { ok: true } | { ok: false; error: string };

export async function kpiUpsert(
  params: MonthlyKpiUpdatePayload,
): Promise<KpiUpsertResult> {
  const {
    id,
    month,
    category,
    country,
    val_target_monthly,
    val_target_daily,
    val_actual_monthly,
    val_actual_daily,
  } = params;

  const payload = {
    ...(val_target_monthly !== undefined && { val_target_monthly }),
    ...(val_target_daily !== undefined && { val_target_daily }),
    ...(val_actual_monthly !== undefined && { val_actual_monthly }),
    ...(val_actual_daily !== undefined && { val_actual_daily }),
  };

  const supabase = await createClient();

  if (id != null && Number.isFinite(Number(id))) {
    const { error } = await supabase
      .schema("dna_kpi")
      .from("monthly_kpi")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const monthForDb = toFirstDayOfMonth(month);
  if (!monthForDb) {
    return { ok: false, error: "Invalid month format (expected YYYY-MM or YYYY-MM-DD)" };
  }

  const row = {
    month: monthForDb,
    category,
    country,
    val_target_monthly: val_target_monthly ?? null,
    val_target_daily: val_target_daily ?? null,
    val_actual_monthly: val_actual_monthly ?? null,
    val_actual_daily: val_actual_daily ?? null,
  };

  const { error } = await supabase
    .schema("dna_kpi")
    .from("monthly_kpi")
    .upsert(row, {
      onConflict: "month,category,country",
    });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
