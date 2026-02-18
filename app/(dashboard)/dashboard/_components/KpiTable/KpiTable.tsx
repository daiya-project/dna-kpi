"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table } from "@/components/ui/table";
import type { MonthlyTableSection } from "@/lib/logic/kpi-table-data";
import { buildDisplayColumns } from "@/lib/logic/kpi-table-data";
import {
  getSectionTableDisplayConfig,
  filterAndOrderMetricRows,
} from "@/lib/config/kpi-table-sections";
import { regionToCountry } from "@/types/app-db.types";
import { useKpiTableCollapse } from "@/hooks/useKpiTableCollapse";
import { KpiTableHeader } from "./KpiTableHeader";
import { KpiTableSection } from "./KpiTableSection";
import { KpiUpsertModal } from "./KpiUpsertModal";
import { kpiUpsert } from "./kpi-upsert";
import type { KpiCellEditContext, KpiEditDraft } from "./types";

/** Section styling for table header and rows (id, label, colors). */
export interface TableSectionConfig {
  id: string;
  label?: string;
  color?: string;
  lightColor?: string;
  fgColor?: string;
  borderColor?: string;
}

interface KpiTableProps {
  months: string[];
  sections: MonthlyTableSection[];
  activeFilter: string | null;
  sectionRefs: React.MutableRefObject<Record<string, HTMLTableSectionElement | null>>;
  getCategoryConfig: (id: string) => TableSectionConfig | undefined;
  /** Ref for the horizontal scroll container (for year navigator scroll-to). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** summary = read-only; kr | us = editable. */
  region?: "summary" | "kr" | "us";
}

/** Metric IDs that allow cell edit (target/daily_target, achievement/daily_achievement). */
const EDITABLE_METRIC_IDS = [
  "target",
  "daily_target",
  "achievement",
  "daily_achievement",
] as const;

export function KpiTable({
  months: monthsProp,
  sections: sectionsProp,
  activeFilter,
  sectionRefs,
  getCategoryConfig,
  scrollContainerRef,
  region = "summary",
}: KpiTableProps) {
  const router = useRouter();
  const months = Array.isArray(monthsProp) ? monthsProp : [];
  const sections = Array.isArray(sectionsProp) ? sectionsProp : [];
  const displayColumns = buildDisplayColumns(months);

  const [editContext, setEditContext] = useState<KpiCellEditContext | null>(null);
  const [editDraft, setEditDraft] = useState<KpiEditDraft | null>(null);
  const [unmapMonthlyDaily, setUnmapMonthlyDaily] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  const {
    collapsedMonths,
    collapsedQuarterPeriods,
    showQuarterlyProgress,
    toggleMonthSection,
    toggleQuarterPeriod,
    toggleQuarterlyProgress,
  } = useKpiTableCollapse();

  const columnCount = 2 + displayColumns.length;
  const isEditMode = editContext !== null;
  const country = regionToCountry(region);

  const exitEditMode = useCallback(() => {
    setEditContext(null);
    setEditDraft(null);
    setUnmapMonthlyDaily(false);
    setEditError(null);
  }, []);

  const handleEnterEditMode = useCallback(
    (ctx: KpiCellEditContext, initial: KpiEditDraft) => {
      if (country == null) return;
      setEditContext(ctx);
      setEditDraft(initial);
      setUnmapMonthlyDaily(false);
      setEditError(null);
    },
    [country],
  );

  const noopDraftChange = useCallback((_draft: KpiEditDraft) => {}, []);

  const handleSave = useCallback(
    async (draft: KpiEditDraft) => {
      if (editContext == null) return;
      setEditPending(true);
      setEditError(null);
      const payload = {
        id: editContext.id ?? undefined,
        month: editContext.month,
        category: editContext.category,
        country: editContext.country,
        ...(editContext.field === "target"
          ? {
              val_target_monthly: draft.monthly,
              val_target_daily: draft.daily,
            }
          : {
              val_actual_monthly: draft.monthly,
              val_actual_daily: draft.daily,
            }),
      };
      const result = await kpiUpsert(payload);
      setEditPending(false);
      if (result.ok) {
        router.refresh();
        exitEditMode();
      } else {
        setEditError(result.error);
      }
    },
    [editContext, router, exitEditMode],
  );

  return (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-glass-border bg-glass shadow-xl shadow-glass-shadow backdrop-blur-xl">
      <KpiUpsertModal
        open={isEditMode}
        editContext={editContext}
        editDraft={editDraft}
        unmapMonthlyDaily={unmapMonthlyDaily}
        onUnmapChange={setUnmapMonthlyDaily}
        onCancel={exitEditMode}
        onSave={handleSave}
        editError={editError}
        editPending={editPending}
      />
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto"
      >
        <Table>
          <KpiTableHeader
            displayColumns={displayColumns}
            collapsedQuarterPeriods={collapsedQuarterPeriods}
            onToggleQuarterPeriod={toggleQuarterPeriod}
          />
          {sections.map((section) => {
            const categoryId = section?.category ?? "unknown";
            const config = getCategoryConfig(categoryId);
            const displayConfig = getSectionTableDisplayConfig(categoryId);
            const showQuarterlyBlock = displayConfig?.showQuarterly !== false;
            const showMonthlyBlock = displayConfig?.showMonthly !== false;
            const quarterlyRows = filterAndOrderMetricRows(
              section?.rows ?? [],
              displayConfig?.visibleMetricsQuarterly,
            );
            const monthlyRows = filterAndOrderMetricRows(
              section?.rows ?? [],
              displayConfig?.visibleMetricsMonthly,
            );
            const isHighlighted = activeFilter === categoryId;
            const isDimmed = activeFilter !== null && !isHighlighted;
            const isEditingThis =
              isEditMode &&
              editContext !== null &&
              editContext.category === categoryId;

            return (
              <KpiTableSection
                key={categoryId}
                section={section}
                displayColumns={displayColumns}
                months={months}
                columnCount={columnCount}
                config={config}
                isHighlighted={isHighlighted}
                isDimmed={isDimmed}
                collapsedMonths={collapsedMonths}
                collapsedQuarterPeriods={collapsedQuarterPeriods}
                showQuarterlyProgress={showQuarterlyProgress}
                onToggleMonthSection={toggleMonthSection}
                onToggleQuarterlyProgress={toggleQuarterlyProgress}
                sectionRef={(el) => {
                  sectionRefs.current[categoryId] = el;
                }}
                categoryId={categoryId}
                region={region}
                editContext={isEditingThis ? editContext : null}
                editDraft={isEditingThis ? editDraft : null}
                unmapMonthlyDaily={unmapMonthlyDaily}
                onEnterEditMode={handleEnterEditMode}
                onDraftChange={noopDraftChange}
                editableMetrics={EDITABLE_METRIC_IDS}
                showQuarterlyBlock={showQuarterlyBlock}
                showMonthlyBlock={showMonthlyBlock}
                quarterlyRows={quarterlyRows}
                monthlyRows={monthlyRows}
              />
            );
          })}
        </Table>
      </div>
    </div>
  );
}
