"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MonthlyTableSection, MonthlyMetricRow } from "@/lib/logic/kpi-table-data";

/** Section styling for table header and rows (id, label, colors). */
export interface TableSectionConfig {
  id: string;
  label?: string;
  color?: string;
  lightColor?: string;
  fgColor?: string;
  borderColor?: string;
}

/** Opacity via style (no transform) so sticky works inside tbody. */

const SECTION_LABEL_QUARTERLY = "QUARTERLY";
const SECTION_LABEL_MONTHLY = "MONTHLY";

/** Width of the vertical label column (narrow pillar). */
const LABEL_COLUMN_WIDTH = "2rem";

/** Display column: either a month (YYYY-MM) or a summary (Q1/Q2/Q3/Q4/Year). */
type DisplayColumn =
  | { key: string; type: "month"; ym: string }
  | { key: string; type: "summary"; label: string };

/**
 * Build column list with summary columns injected:
 * After Mar (-03) → Q1 Total; after Jun (-06) → Q2 Total;
 * after Sep (-09) → Q3 Total; after Dec (-12) → Q4 Total, Year Total.
 */
function buildDisplayColumns(months: string[]): DisplayColumn[] {
  const out: DisplayColumn[] = [];
  for (const ym of months) {
    out.push({ key: ym, type: "month", ym });
    const mm = ym.slice(5, 7);
    if (mm === "03") out.push({ key: `${ym}-q1`, type: "summary", label: "Q1 Total" });
    if (mm === "06") out.push({ key: `${ym}-q2`, type: "summary", label: "Q2 Total" });
    if (mm === "09") out.push({ key: `${ym}-q3`, type: "summary", label: "Q3 Total" });
    if (mm === "12") {
      const y = ym.slice(0, 4);
      out.push({ key: `${ym}-q4`, type: "summary", label: "Q4 Total" });
      out.push({ key: `${y}-year`, type: "summary", label: "Year Total" });
    }
  }
  return out;
}

/** Summary column cell styling (slightly distinct from month columns). */
const SUMMARY_COL_HEAD_CLASS =
  "min-w-[90px] border-r border-glass-border text-right font-mono text-xs font-semibold bg-slate-100/50 dark:bg-slate-800/50";
const SUMMARY_COL_CELL_CLASS =
  "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums font-semibold bg-slate-100/50 dark:bg-slate-800/50";

function formatNumber(num: number): string {
  const n = Number(num);
  if (Number.isNaN(n)) return "—";
  if (n >= 1000) return n.toLocaleString("en-US");
  return n.toFixed(1);
}

function formatCell(row: MonthlyMetricRow, value: number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  if (row.isRate) return `${n}%`;
  return formatNumber(n);
}

interface KpiTableProps {
  months: string[];
  sections: MonthlyTableSection[];
  activeFilter: string | null;
  sectionRefs: React.MutableRefObject<Record<string, HTMLTableSectionElement | null>>;
  getCategoryConfig: (id: string) => TableSectionConfig | undefined;
  /** Ref for the horizontal scroll container (for year navigator scroll-to). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function KpiTable({
  months: monthsProp,
  sections: sectionsProp,
  activeFilter,
  sectionRefs,
  getCategoryConfig,
  scrollContainerRef,
}: KpiTableProps) {
  const months = Array.isArray(monthsProp) ? monthsProp : [];
  const sections = Array.isArray(sectionsProp) ? sectionsProp : [];
  const displayColumns = buildDisplayColumns(months);
  const columnCount = 2 + displayColumns.length;

  return (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-glass-border bg-glass shadow-xl shadow-glass-shadow backdrop-blur-xl">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted hover:bg-muted">
              <TableHead
                className={cn(
                  "sticky left-0 z-30 w-8 min-w-8 max-w-8 border-r border-glass-border bg-muted",
                )}
                style={{ width: LABEL_COLUMN_WIDTH, minWidth: LABEL_COLUMN_WIDTH }}
              >
                <span className="sr-only">Section</span>
              </TableHead>
              <TableHead
                className={cn(
                  "sticky left-8 z-30 min-w-[180px] border-r border-glass-border bg-muted font-semibold",
                )}
              >
                Metric
              </TableHead>
              {displayColumns.map((col) =>
                col.type === "month" ? (
                  <TableHead
                    key={col.key}
                    id={col.ym.endsWith("-01") ? `col-year-${col.ym.slice(0, 4)}` : undefined}
                    className="min-w-[90px] border-r border-glass-border text-right font-mono text-xs font-semibold"
                  >
                    {col.ym}
                  </TableHead>
                ) : (
                  <TableHead key={col.key} className={SUMMARY_COL_HEAD_CLASS}>
                    {col.label}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          {sections.map((section) => {
            const categoryId = section?.category ?? "unknown";
            const config = getCategoryConfig(categoryId);
            const isHighlighted = activeFilter === categoryId;
            const isDimmed = activeFilter !== null && !isHighlighted;
            const monthlyRowCount = (section?.rows ?? []).length;

            return (
              <TableBody
                key={categoryId}
                ref={(el) => {
                  sectionRefs.current[categoryId] = el;
                }}
                id={`section-${categoryId}`}
                className="scroll-mt-[120px] transition-opacity duration-300"
                style={{ opacity: isDimmed ? 0.35 : 1 }}
              >
                {/* Section header: sticky so "Ads"/"Media" stay visible; solid bg, no blur, so divider is sharp. */}
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
                  {/* Empty cells for each display column (months + summary) */}
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

                {/* Quarterly row group: same metrics as Monthly, mock/placeholder data */}
                {(section?.rows ?? []).map((row, rowIdx) => (
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
                        className="sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2"
                        style={{
                          width: LABEL_COLUMN_WIDTH,
                          minWidth: LABEL_COLUMN_WIDTH,
                        }}
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
                    {displayColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.type === "summary" ? SUMMARY_COL_CELL_CLASS : "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums",
                        )}
                      >
                        —
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Monthly data rows: first row has vertical label cell with rowSpan */}
                {(section?.rows ?? []).map((row, rowIdx) => (
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
                          "sticky left-0 z-30 w-8 min-w-8 border-r border-glass-border bg-background/95 backdrop-blur-sm align-middle py-2",
                        )}
                        style={{
                          width: LABEL_COLUMN_WIDTH,
                          minWidth: LABEL_COLUMN_WIDTH,
                        }}
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
                    {displayColumns.map((col) => {
                      const value =
                        col.type === "month"
                          ? (row.values ?? [])[months.indexOf(col.ym)]
                          : undefined;
                      const isSummary = col.type === "summary";
                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            isSummary ? SUMMARY_COL_CELL_CLASS : "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums",
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

                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-3 border-0 bg-transparent p-0"
                  />
                </TableRow>
              </TableBody>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
