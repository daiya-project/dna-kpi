"use client";

import { Table } from "@/components/ui/table";
import type { MonthlyTableSection } from "@/lib/logic/kpi-table-data";
import { buildDisplayColumns } from "@/lib/logic/kpi-table-data";
import { useKpiTableCollapse } from "@/hooks/useKpiTableCollapse";
import { KpiTableHeader } from "./KpiTableHeader";
import { KpiTableSection } from "./KpiTableSection";

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

  const {
    collapsedMonths,
    collapsedQuarterPeriods,
    showQuarterlyProgress,
    toggleMonthSection,
    toggleQuarterPeriod,
    toggleQuarterlyProgress,
  } = useKpiTableCollapse();

  const columnCount = 2 + displayColumns.length;

  return (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-glass-border bg-glass shadow-xl shadow-glass-shadow backdrop-blur-xl">
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
            const isHighlighted = activeFilter === categoryId;
            const isDimmed = activeFilter !== null && !isHighlighted;

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
              />
            );
          })}
        </Table>
      </div>
    </div>
  );
}
