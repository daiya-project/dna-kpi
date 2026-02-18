"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import type { KpiCellEditContext, KpiEditDraft } from "./types";

interface KpiUpsertControllerProps {
  editContext: KpiCellEditContext | null;
  editDraft: KpiEditDraft | null;
  unmapMonthlyDaily: boolean;
  onUnmapChange: (value: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  editError: string | null;
  editPending: boolean;
}

/**
 * Strip above table in edit mode: checkbox to unmap monthly/daily, Cancel, Save, error/loading.
 * Rendered in edit mode only; parent locks body scroll.
 */
export function KpiUpsertController({
  editContext,
  editDraft,
  unmapMonthlyDaily,
  onUnmapChange,
  onCancel,
  onSave,
  editError,
  editPending,
}: KpiUpsertControllerProps) {
  if (editContext == null) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[51] flex flex-wrap items-center gap-4 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm"
      role="region"
      aria-label="KPI 셀 수정"
    >
      <span className="text-sm font-medium text-muted-foreground">
        {editContext.category} · {editContext.month}
        {editContext.field === "target" ? " (Target)" : " (Achievement)"}
      </span>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={unmapMonthlyDaily}
          onCheckedChange={(v) => onUnmapChange(v === true)}
          aria-label="Monthly × Daily Mapping 해제"
        />
        <span>Monthly × Daily Mapping 해제</span>
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={editPending}
        >
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={editPending || editDraft == null}
        >
          {editPending ? "저장 중…" : "저장"}
        </Button>
      </div>
      {editError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          <span>{editError}</span>
        </div>
      )}
    </div>
  );
}
