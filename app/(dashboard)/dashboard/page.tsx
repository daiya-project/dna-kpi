import { Suspense } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { DashboardPageClient } from "./_components/Dashboard/DashboardPageClient";
import { categories } from "@/lib/config/categories";
import { fetchMonthlyKpi } from "@/lib/api/kpi";
import { buildMonthlyTableSections } from "@/lib/logic/kpi-table-data";
import { buildSummaryYtdByCategory } from "@/lib/logic/kpi-card";

interface PageProps {
  searchParams: Promise<{ region?: string; year?: string }>;
}

/** Derive sorted years from YYYY-MM month list (for year navigator). */
function getYearsFromMonths(months: string[]): number[] {
  const set = new Set(months.map((m) => parseInt(m.slice(0, 4), 10)));
  return Array.from(set).sort((a, b) => a - b);
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const region = params.region === "kr" || params.region === "us" ? params.region : undefined;
  const currentYear = new Date().getFullYear();

  let months: string[] = [];
  let sections: Awaited<ReturnType<typeof buildMonthlyTableSections>>["sections"] = [];
  let summaryYtd: Record<string, number> = { cm: 0, media: 0, ads: 0, "media-fee": 0 };
  let error: string | null = null;

  try {
    // All-year view: no month filter — load all data from DB (oldest to newest)
    const rows = await fetchMonthlyKpi({
      region: region ?? "summary",
    });
    const built = buildMonthlyTableSections(rows); // no year → months from data, ascending
    months = built.months;
    sections = built.sections;
    summaryYtd = buildSummaryYtdByCategory(rows, currentYear);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load KPI data";
  }

  const initialYears = getYearsFromMonths(months);
  const initialYear =
    params.year != null ? parseInt(params.year, 10) : currentYear;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPageClient
        categories={categories}
        initialMonths={months}
        initialSections={sections}
        initialSummaryYtd={summaryYtd}
        initialRegion={params.region ?? "summary"}
        initialYears={initialYears}
        initialYear={initialYear}
        error={error}
      />
    </Suspense>
  );
}
