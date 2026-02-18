"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { getCategoryLabel } from "@/lib/config/categories";
import { getDaysInMonth } from "@/lib/date-utils";
import { monthlyToDaily, dailyToMonthly, parseNumber } from "@/lib/number-utils";
import {
  formatWithThousandSeparator,
  stripThousandSeparator,
} from "@/lib/string-utils";
import type { KpiCellEditContext, KpiEditDraft } from "./types";
import { getMetricLabel } from "./types";

export type DrivingField = "monthly" | "daily";

const INITIAL_DRAFT: KpiEditDraft = { monthly: 0, daily: 0 };

interface KpiUpsertModalProps {
  /** When false, modal is closed; when true, editContext must be non-null. */
  open: boolean;
  editContext: KpiCellEditContext | null;
  /** Initial draft when modal opens; typing is kept in local state to avoid parent re-renders. */
  editDraft: KpiEditDraft | null;
  unmapMonthlyDaily: boolean;
  onUnmapChange: (value: boolean) => void;
  onCancel: () => void;
  /** Called with current draft (from local state) when user clicks Save. */
  onSave: (draft: KpiEditDraft) => void;
  editError: string | null;
  editPending: boolean;
}

/**
 * Modal for editing a single month's KPI pair (Monthly + Daily).
 * Uses Shadcn Dialog. When Mapping is enabled, one field drives the other (monthly ↔ daily).
 */
export function KpiUpsertModal({
  open,
  editContext,
  editDraft,
  unmapMonthlyDaily,
  onUnmapChange,
  onCancel,
  onSave,
  editError,
  editPending,
}: KpiUpsertModalProps) {
  const monthlyInputRef = useRef<HTMLInputElement>(null);
  const [drivingField, setDrivingField] = useState<DrivingField>("monthly");
  /** Local draft so typing does not trigger parent re-renders (fixes input lag). */
  const [localDraft, setLocalDraft] = useState<KpiEditDraft>(INITIAL_DRAFT);

  const month = editContext?.month ?? "";
  const daysInMonth = getDaysInMonth(month);
  const categoryLabel = editContext?.category
    ? getCategoryLabel(editContext.category)
    : "";
  const metricLabel = editContext ? getMetricLabel(editContext.field) : "";
  const title =
    editContext && categoryLabel && metricLabel && month
      ? `${categoryLabel} · ${metricLabel} · ${month}`
      : "KPI 수정";

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onCancel();
    },
    [onCancel],
  );

  // Sync local draft from parent only when modal opens (avoids overwriting while typing)
  useEffect(() => {
    if (open && editContext) {
      setDrivingField("monthly");
      setLocalDraft(editDraft ?? INITIAL_DRAFT);
    }
  }, [open, editContext?.month, editContext?.category, editContext?.field, editDraft]);

  useEffect(() => {
    if (open && monthlyInputRef.current) {
      monthlyInputRef.current.focus();
    }
  }, [open]);

  const handleMonthlyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripThousandSeparator(e.target.value);
      const num = parseNumber(raw);
      if (Number.isNaN(num) && raw !== "") return;
      const monthly = Number.isNaN(num) ? 0 : num;
      const daily =
        daysInMonth > 0 ? monthlyToDaily(monthly, daysInMonth) : 0;
      setDrivingField("monthly");
      setLocalDraft({ monthly, daily });
    },
    [daysInMonth],
  );

  const handleDailyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripThousandSeparator(e.target.value);
      const num = parseNumber(raw);
      if (Number.isNaN(num) && raw !== "") return;
      const daily = Number.isNaN(num) ? 0 : num;
      const monthly =
        daysInMonth > 0 ? dailyToMonthly(daily, daysInMonth) : 0;
      setDrivingField("daily");
      setLocalDraft({ monthly, daily });
    },
    [daysInMonth],
  );

  const monthlyValue =
    localDraft.monthly !== undefined && localDraft.monthly !== null
      ? localDraft.monthly === 0
        ? ""
        : formatWithThousandSeparator(localDraft.monthly)
      : "";
  const dailyValue =
    localDraft.daily !== undefined && localDraft.daily !== null
      ? localDraft.daily === 0
        ? ""
        : formatWithThousandSeparator(localDraft.daily)
      : "";

  const monthlyDisabled =
    !unmapMonthlyDaily && drivingField === "daily";
  const dailyDisabled =
    !unmapMonthlyDaily && drivingField === "monthly";

  const displayMonthlyNum =
    !unmapMonthlyDaily && drivingField === "daily" && daysInMonth > 0
      ? dailyToMonthly(localDraft.daily, daysInMonth)
      : localDraft.monthly ?? 0;
  const displayDailyNum =
    !unmapMonthlyDaily && drivingField === "monthly" && daysInMonth > 0
      ? monthlyToDaily(localDraft.monthly, daysInMonth)
      : localDraft.daily ?? 0;

  const handleSave = useCallback(() => {
    onSave(localDraft);
  }, [onSave, localDraft]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="kpi-modal-description"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div id="kpi-modal-description" className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label htmlFor="kpi-monthly" className="text-sm font-medium">
              Monthly
            </label>
            <Input
              id="kpi-monthly"
              ref={monthlyInputRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={
                monthlyDisabled
                  ? formatWithThousandSeparator(displayMonthlyNum)
                  : monthlyValue
              }
              onChange={handleMonthlyChange}
              disabled={monthlyDisabled}
              className="font-mono tabular-nums"
              aria-label="Monthly 값"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="kpi-daily" className="text-sm font-medium">
              Daily
            </label>
            <Input
              id="kpi-daily"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={
                dailyDisabled
                  ? formatWithThousandSeparator(displayDailyNum)
                  : dailyValue
              }
              onChange={handleDailyChange}
              disabled={dailyDisabled}
              className="font-mono tabular-nums"
              aria-label="Daily 값"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={unmapMonthlyDaily}
              onCheckedChange={(v) => onUnmapChange(v === true)}
              aria-label="Monthly × Daily Mapping 해제"
            />
            <span>Monthly × Daily Mapping 해제</span>
          </label>
          {editError && (
            <div
              className="flex items-center gap-2 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              <span>{editError}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={editPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={editPending}
          >
            {editPending ? "저장 중…" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
