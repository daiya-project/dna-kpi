"use client";

import { Fragment } from "react";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type {
  DisplayColumn,
  MonthlyTableSection,
  MonthlyMetricRow,
} from "@/lib/logic/kpi-table-data";
import { getQuarterFromMonth } from "@/lib/date-utils";
import { formatNumber, formatPercent } from "@/lib/number-utils";
import type { TableSectionConfig } from "./KpiTable";
import { QuarterProgressBar } from "./QuarterProgressBar";
import type { KpiCellEditContext, KpiEditDraft } from "./types";

interface KpiTableSectionProps {
  section: MonthlyTableSection;
  displayColumns: DisplayColumn[];
  months: string[];
  columnCount: number;
  config: TableSectionConfig | undefined;
  isHighlighted: boolean;
  isDimmed: boolean;
  collapsedMonths: Set<string>;
  collapsedQuarterPeriods: Set<string>;
  showQuarterlyProgress: Set<string>;
  onToggleMonthSection: (sectionGroupId: string) => void;
  onToggleQuarterlyProgress: (categoryId: string) => void;
  sectionRef: (el: HTMLTableSectionElement | null) => void;
  categoryId: string;
  /** summary = read-only; kr | us = editable. */
  region?: "summary" | "kr" | "us";
  editContext: KpiCellEditContext | null;
  editDraft: KpiEditDraft | null;
  unmapMonthlyDaily: boolean;
  onEnterEditMode: (ctx: KpiCellEditContext, initial: KpiEditDraft) => void;
  onDraftChange: (draft: KpiEditDraft) => void;
  editableMetrics: readonly string[];
}

const LABEL_COLUMN_WIDTH = "2rem";
const SECTION_LABEL_QUARTERLY = "QUARTERLY";
const SECTION_LABEL_MONTHLY = "MONTHLY";
const SUMMARY_COL_CELL_CLASS =
  "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums font-semibold bg-slate-100/50 dark:bg-slate-800/50";
const DATA_CELL_CLASS =
  "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums";

function getFieldFromMetric(metric: string): "target" | "actual" | null {
  if (metric === "Target" || metric === "Daily Target") return "target";
  if (metric === "Achievement" || metric === "Daily Achievement") return "actual";
  return null;
}

function getInitialDraft(
  section: MonthlyTableSection,
  months: string[],
  ym: string,
  field: "target" | "actual",
): KpiEditDraft {
  const idx = months.indexOf(ym);
  const targetRow = section.rows.find((r) => r.metric === "Target");
  const dailyTargetRow = section.rows.find((r) => r.metric === "Daily Target");
  const actualRow = section.rows.find((r) => r.metric === "Achievement");
  const dailyActualRow = section.rows.find((r) => r.metric === "Daily Achievement");
  if (field === "target") {
    const monthly = (targetRow?.values ?? [])[idx] ?? 0;
    const daily = (dailyTargetRow?.values ?? [])[idx] ?? 0;
    return { monthly: Number(monthly) || 0, daily: Number(daily) || 0 };
  }
  const monthly = (actualRow?.values ?? [])[idx] ?? 0;
  const daily = (dailyActualRow?.values ?? [])[idx] ?? 0;
  return { monthly: Number(monthly) || 0, daily: Number(daily) || 0 };
}

function formatCell(row: MonthlyMetricRow, value: number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  if (row.isRate) return formatPercent(n);
  return formatNumber(n);
}

/**
 * Calculate quarter aggregates (Target/Actual) from monthly data
 */
function calculateQuarterAggregates(
  section: MonthlyTableSection,
  months: string[],
  quarterId: string,
): { target: number; actual: number } | null {
  const targetRow = section.rows.find((r) => r.metric === "Target");
  const actualRow = section.rows.find((r) => r.metric === "Achievement");

  if (!targetRow || !actualRow) return null;

  // Find indices of months belonging to this quarter
  const quarterMonthIndices = months
    .map((ym, idx) => ({ ym, idx }))
    .filter((item) => getQuarterFromMonth(item.ym) === quarterId)
    .map((item) => item.idx);

  if (quarterMonthIndices.length === 0) return null;

  const target = quarterMonthIndices.reduce(
    (sum, idx) => sum + Number(targetRow.values[idx] ?? 0),
    0,
  );
  const actual = quarterMonthIndices.reduce(
    (sum, idx) => sum + Number(actualRow.values[idx] ?? 0),
    0,
  );

  return { target, actual };
}

/**
 * Single section (tbody) with category header and metric rows.
 * Supports quarterly and monthly row groups with collapse functionality.
 */
export function KpiTableSection({
  section,
  displayColumns,
  months,
  columnCount,
  config,
  isHighlighted,
  isDimmed,
  collapsedMonths,
  collapsedQuarterPeriods,
  showQuarterlyProgress,
  onToggleMonthSection,
  onToggleQuarterlyProgress,
  sectionRef,
  categoryId,
  region = "summary",
  editContext,
  editDraft,
  unmapMonthlyDaily,
  onEnterEditMode,
  onDraftChange,
  editableMetrics = [],
}: KpiTableSectionProps) {
  const monthlyRowCount = (section?.rows ?? []).length;
  const monthlyCollapsed = collapsedMonths.has(`${categoryId}-monthly`);
  const isQuarterlyProgressView = showQuarterlyProgress.has(categoryId);
  const country = region === "kr" || region === "us" ? region : undefined;
  const canEdit = country !== undefined;
  const editableSet = new Set(editableMetrics);

  // Group display columns by quarters for rendering logic
  const columnGroups: Array<{
    type: "quarter";
    quarterId: string;
    monthColumns: DisplayColumn[];
    summaryColumn: DisplayColumn | null;
  } | {
    type: "other";
    column: DisplayColumn;
  }> = [];

  let currentQuarterMonths: DisplayColumn[] = [];
  let currentQuarterId: string | null = null;

  for (const col of displayColumns) {
    if (col.type === "month") {
      const quarter = getQuarterFromMonth(col.ym);
      if (quarter !== currentQuarterId && currentQuarterId !== null) {
        // New quarter started, save previous
        columnGroups.push({
          type: "quarter",
          quarterId: currentQuarterId,
          monthColumns: currentQuarterMonths,
          summaryColumn: null,
        });
        currentQuarterMonths = [];
      }
      currentQuarterId = quarter;
      currentQuarterMonths.push(col);
    } else if (col.type === "summary" && col.quarterId) {
      // This is a quarter summary column
      if (currentQuarterId === col.quarterId && currentQuarterMonths.length > 0) {
        columnGroups.push({
          type: "quarter",
          quarterId: col.quarterId,
          monthColumns: currentQuarterMonths,
          summaryColumn: col,
        });
        currentQuarterMonths = [];
        currentQuarterId = null;
      } else {
        columnGroups.push({ type: "other", column: col });
      }
    } else {
      // Year Total or other summary
      columnGroups.push({ type: "other", column: col });
    }
  }

  // Handle remaining months
  if (currentQuarterMonths.length > 0 && currentQuarterId) {
    columnGroups.push({
      type: "quarter",
      quarterId: currentQuarterId,
      monthColumns: currentQuarterMonths,
      summaryColumn: null,
    });
  }

  return (
    <TableBody
      ref={sectionRef}
      id={`section-${categoryId}`}
      className="scroll-mt-[120px] transition-opacity duration-300"
      style={{ opacity: isDimmed ? 0.35 : 1 }}
    >
      {/* Section header row */}
      <TableRow
        className={cn(
          "border-t-2 font-bold [backdrop-filter:none]",
          config?.borderColor,
        )}
      >
        <TableCell
          className="sticky left-0 z-[40] w-8 min-w-8 max-w-8 border-r border-glass-border bg-muted p-0"
          style={{ width: LABEL_COLUMN_WIDTH, minWidth: LABEL_COLUMN_WIDTH }}
        />
        <TableCell
          className={cn(
            "sticky left-8 z-[40] min-w-[180px] border-r border-glass-border bg-muted py-2.5",
            config?.fgColor,
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2.5 rounded-full",
                config?.color,
              )}
            />
            {config?.label ?? categoryId}
          </div>
        </TableCell>
        {displayColumns.map((col) => (
          <TableCell
            key={col.key}
            className={cn(
              "border-r border-glass-border bg-muted",
              col.type === "summary" && "bg-slate-100/50 dark:bg-slate-800/50",
            )}
          />
        ))}
      </TableRow>

      {/* Quarterly row group: 1 row (progress view) or 6 rows (month values) */}
      {isQuarterlyProgressView ? (
        <TableRow
          className={cn(
            "border-b border-border/30 transition-colors hover:bg-secondary/30",
            isHighlighted && config?.lightColor,
          )}
        >
          <TableCell
            className="sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2 cursor-pointer select-none hover:bg-secondary/50 transition-colors"
            style={{
              width: LABEL_COLUMN_WIDTH,
              minWidth: LABEL_COLUMN_WIDTH,
            }}
            onClick={() => onToggleQuarterlyProgress(categoryId)}
            title="행 모두 보기"
          >
            <div className="flex items-center justify-center" aria-hidden>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </TableCell>
          <TableCell
            className={cn(
              "sticky left-8 z-30 border-r border-glass-border bg-background/95 backdrop-blur-sm px-4 py-1.5 text-xs font-medium",
              isHighlighted && config?.lightColor,
            )}
          >
            {SECTION_LABEL_QUARTERLY}
          </TableCell>
          {columnGroups.map((group, groupIdx) => {
            if (group.type === "quarter") {
              const isColumnHidden = collapsedQuarterPeriods.has(group.quarterId);
              // When quarter is collapsed, header shows only summary column → render one cell to align
              if (isColumnHidden) {
                return group.summaryColumn ? (
                  <TableCell
                    key={group.summaryColumn.key}
                    className={SUMMARY_COL_CELL_CLASS}
                  >
                    —
                  </TableCell>
                ) : null;
              }
              const aggregates = calculateQuarterAggregates(section, months, group.quarterId);
              const monthSpan = group.monthColumns.length;
              const cells = [
                <TableCell
                  key={`${group.quarterId}-progress-${groupIdx}`}
                  colSpan={monthSpan}
                  className="border-r border-glass-border px-2 py-1"
                >
                  {aggregates ? (
                    <QuarterProgressBar
                      target={aggregates.target}
                      actual={aggregates.actual}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>,
              ];
              if (group.summaryColumn) {
                cells.push(
                  <TableCell
                    key={group.summaryColumn.key}
                    className={SUMMARY_COL_CELL_CLASS}
                  >
                    —
                  </TableCell>,
                );
              }
              return <Fragment key={`quarter-${group.quarterId}-${groupIdx}`}>{cells}</Fragment>;
            }
            return (
              <TableCell
                key={group.column.key}
                className={cn(
                  group.column.type === "summary"
                    ? SUMMARY_COL_CELL_CLASS
                    : DATA_CELL_CLASS,
                )}
              >
                —
              </TableCell>
            );
          })}
        </TableRow>
      ) : (
        (section?.rows ?? []).map((row, rowIdx) => (
          <TableRow
            key={`${categoryId}-quarterly-${rowIdx}-${row.metric}`}
            className={cn(
              "border-b border-border/30 transition-colors hover:bg-secondary/30",
              isHighlighted && config?.lightColor,
            )}
          >
            {rowIdx === 0 && (
              <TableCell
                rowSpan={(section?.rows ?? []).length}
                className="sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2 cursor-pointer select-none hover:bg-secondary/50 transition-colors"
                style={{
                  width: LABEL_COLUMN_WIDTH,
                  minWidth: LABEL_COLUMN_WIDTH,
                }}
                onClick={() => onToggleQuarterlyProgress(categoryId)}
              >
                <div className="flex flex-col items-center justify-center gap-0.5 leading-none uppercase tracking-widest text-muted-foreground text-[11px]">
                  {SECTION_LABEL_QUARTERLY.split("").map((char, i) => (
                    <span key={`q-${i}-${char}`}>{char}</span>
                  ))}
                </div>
              </TableCell>
            )}
            <TableCell
              className={cn(
                "sticky left-8 z-30 border-r border-glass-border bg-background/95 backdrop-blur-sm px-4 py-1.5 text-xs font-medium",
                isHighlighted && config?.lightColor,
              )}
            >
              {row.metric}
            </TableCell>
            {columnGroups.map((group, groupIdx) => {
              if (group.type === "quarter") {
                const isColumnHidden = collapsedQuarterPeriods.has(group.quarterId);
                if (isColumnHidden) {
                  if (group.summaryColumn) {
                    const value =
                      (row.values ?? [])[months.indexOf(group.summaryColumn.key)];
                    return (
                      <TableCell
                        key={group.summaryColumn.key}
                        className={SUMMARY_COL_CELL_CLASS}
                      >
                        {value !== undefined && !Number.isNaN(Number(value))
                          ? formatCell(row, Number(value))
                          : "—"}
                      </TableCell>
                    );
                  }
                  return null;
                }
                const cells = group.monthColumns.map((col) => {
                  const ym = col.type === "month" ? col.ym : "";
                  const value = (row.values ?? [])[months.indexOf(ym)];
                  return (
                    <TableCell
                      key={col.key}
                      className={DATA_CELL_CLASS}
                    >
                      {value !== undefined && !Number.isNaN(Number(value))
                        ? formatCell(row, Number(value))
                        : "—"}
                    </TableCell>
                  );
                });
                if (group.summaryColumn) {
                  const summaryValue = (row.values ?? [])[months.indexOf(group.summaryColumn.key)];
                  cells.push(
                    <TableCell
                      key={group.summaryColumn.key}
                      className={SUMMARY_COL_CELL_CLASS}
                    >
                      {summaryValue !== undefined && !Number.isNaN(Number(summaryValue))
                        ? formatCell(row, Number(summaryValue))
                        : "—"}
                    </TableCell>,
                  );
                }
                return cells;
              }
              return (
                <TableCell
                  key={group.column.key}
                  className={cn(
                    group.column.type === "summary"
                      ? SUMMARY_COL_CELL_CLASS
                      : DATA_CELL_CLASS,
                  )}
                >
                  —
                </TableCell>
              );
            })}
          </TableRow>
        ))
      )}

      {/* Monthly data rows */}
      {!monthlyCollapsed && (section?.rows ?? []).map((row, rowIdx) => (
        <TableRow
          key={`${categoryId}-${rowIdx}-${row.metric}`}
          className={cn(
            "border-b border-border/30 transition-colors hover:bg-secondary/30",
            isHighlighted && config?.lightColor,
          )}
        >
          {rowIdx === 0 && (
            <TableCell
              rowSpan={monthlyRowCount}
              className={cn(
                "sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2 cursor-pointer select-none hover:bg-secondary/50 transition-colors",
              )}
              style={{
                width: LABEL_COLUMN_WIDTH,
                minWidth: LABEL_COLUMN_WIDTH,
              }}
              onClick={() => onToggleMonthSection(`${categoryId}-monthly`)}
            >
              <div className="flex flex-col items-center justify-center gap-0.5 leading-none uppercase tracking-widest text-muted-foreground text-[11px]">
                {SECTION_LABEL_MONTHLY.split("").map((char, i) => (
                  <span key={`${i}-${char}`}>{char}</span>
                ))}
              </div>
            </TableCell>
          )}
          <TableCell
            className={cn(
              "sticky left-8 z-30 border-r border-glass-border bg-background/95 backdrop-blur-sm px-4 py-1.5 text-xs font-medium",
              isHighlighted && config?.lightColor,
            )}
          >
            {row.metric}
          </TableCell>

          {/* Render columns with quarter collapse logic */}
          {columnGroups.map((group, groupIdx) => {
            if (group.type === "quarter") {
              // MONTHLY section: only check collapsedQuarterPeriods (Q1 Total click)
              const isColumnHidden = collapsedQuarterPeriods.has(group.quarterId);

              if (isColumnHidden) {
                // Skip month columns when hidden, but keep summary
                if (group.summaryColumn) {
                  const value =
                    group.summaryColumn.type === "summary"
                      ? undefined
                      : (row.values ?? [])[months.indexOf(group.summaryColumn.key)];
                  return (
                    <TableCell
                      key={group.summaryColumn.key}
                      className={SUMMARY_COL_CELL_CLASS}
                    >
                      {value !== undefined && !Number.isNaN(Number(value))
                        ? formatCell(row, Number(value))
                        : "—"}
                    </TableCell>
                  );
                }
                return null;
              }

              // Render individual month columns (MONTHLY section). monthColumns are month-type only.
              const cells = group.monthColumns.map((col) => {
                const ym = col.type === "month" ? col.ym : "";
                const value = (row.values ?? [])[months.indexOf(ym)];
                const field = getFieldFromMetric(row.metric);
                const isEditable =
                  canEdit &&
                  field !== null &&
                  editableSet.has(row.metric);

                const handleDoubleClick = () => {
                  if (!isEditable || !country || !field) return;
                  const id = section.monthToRowId?.[ym] ?? null;
                  onEnterEditMode(
                    {
                      id,
                      month: ym,
                      category: categoryId,
                      country,
                      field,
                    },
                    getInitialDraft(section, months, ym, field),
                  );
                };

                return (
                  <TableCell
                    key={col.key}
                    className={DATA_CELL_CLASS}
                    onDoubleClick={isEditable ? handleDoubleClick : undefined}
                    style={isEditable ? { cursor: "cell" } : undefined}
                  >
                    {value !== undefined && !Number.isNaN(Number(value))
                      ? formatCell(row, Number(value))
                      : "—"}
                  </TableCell>
                );
              });

              // Add summary column if exists
              if (group.summaryColumn) {
                cells.push(
                  <TableCell
                    key={group.summaryColumn.key}
                    className={SUMMARY_COL_CELL_CLASS}
                  >
                    —
                  </TableCell>,
                );
              }

              return cells;
            }

            // Other column (Year Total, etc.)
            const otherCol = group.column;
            const value =
              otherCol.type === "month"
                ? (row.values ?? [])[months.indexOf(otherCol.ym)]
                : undefined;
            return (
              <TableCell
                key={group.column.key}
                className={cn(
                  group.column.type === "summary"
                    ? SUMMARY_COL_CELL_CLASS
                    : DATA_CELL_CLASS,
                )}
              >
                {value !== undefined && !Number.isNaN(Number(value))
                  ? formatCell(row, Number(value))
                  : "—"}
              </TableCell>
            );
          })}
        </TableRow>
      ))}

      {/* Monthly collapsed state: show single row with chevron */}
      {monthlyCollapsed && (
        <TableRow
          className={cn(
            "border-b border-border/30 transition-colors hover:bg-secondary/30",
            isHighlighted && config?.lightColor,
          )}
        >
          <TableCell
            className="sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2 cursor-pointer select-none hover:bg-secondary/50 transition-colors"
            style={{
              width: LABEL_COLUMN_WIDTH,
              minWidth: LABEL_COLUMN_WIDTH,
            }}
            onClick={() => onToggleMonthSection(`${categoryId}-monthly`)}
          >
            <div className="flex items-center justify-center">
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </TableCell>
          <TableCell
            colSpan={columnCount - 1}
            className={cn(
              "sticky left-8 z-30 border-r border-glass-border bg-background/95 backdrop-blur-sm px-4 py-1.5 text-xs font-medium italic text-muted-foreground",
              isHighlighted && config?.lightColor,
            )}
          >
            {SECTION_LABEL_MONTHLY} (접힘)
          </TableCell>
        </TableRow>
      )}

      {/* Spacer row */}
      <TableRow>
        <TableCell
          colSpan={columnCount}
          className="h-3 border-0 bg-transparent p-0"
        />
      </TableRow>
    </TableBody>
  );
}
