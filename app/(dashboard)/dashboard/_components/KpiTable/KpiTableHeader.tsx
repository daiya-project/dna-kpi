"use client";

import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getQuarterFromMonth } from "@/lib/date-utils";
import type { DisplayColumn } from "@/lib/logic/kpi-table-data";

interface KpiTableHeaderProps {
  displayColumns: DisplayColumn[];
  collapsedQuarterPeriods: Set<string>;
  onToggleQuarterPeriod: (quarterKey: string) => void;
}

const LABEL_COLUMN_WIDTH = "2rem";
const SUMMARY_COL_HEAD_CLASS =
  "min-w-[90px] border-r border-glass-border text-right font-mono text-xs font-semibold bg-slate-100/50 dark:bg-slate-800/50";

/**
 * Table header row with collapsible quarter columns.
 */
export function KpiTableHeader({
  displayColumns,
  collapsedQuarterPeriods,
  onToggleQuarterPeriod,
}: KpiTableHeaderProps) {
  return (
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
        {displayColumns.map((col) => {
          if (col.type === "month") {
            const quarter = getQuarterFromMonth(col.ym);
            const isCollapsed = quarter ? collapsedQuarterPeriods.has(quarter) : false;

            // Skip rendering month columns if their quarter is collapsed
            if (isCollapsed) return null;

            return (
              <TableHead
                key={col.key}
                id={col.ym.endsWith("-01") ? `col-year-${col.ym.slice(0, 4)}` : undefined}
                className="min-w-[90px] border-r border-glass-border text-right font-mono text-xs font-semibold"
              >
                {col.ym}
              </TableHead>
            );
          }

          // Summary column (Q1 Total, Q2 Total, etc.)
          const quarterId = col.quarterId;
          const isCollapsed = quarterId ? collapsedQuarterPeriods.has(quarterId) : false;

          return (
            <TableHead
              key={col.key}
              className={cn(
                SUMMARY_COL_HEAD_CLASS,
                quarterId && "cursor-pointer select-none transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-700/70",
              )}
              onClick={() => quarterId && onToggleQuarterPeriod(quarterId)}
            >
              <div className="flex items-center justify-end gap-1.5">
                {quarterId &&
                  (isCollapsed ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  ))}
                <span>{col.label}</span>
              </div>
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
