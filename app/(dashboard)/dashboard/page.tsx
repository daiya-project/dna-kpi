import { Suspense } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { DashboardPageClient } from "./_components/Dashboard/DashboardPageClient";
import { DashboardSummaryComingSoon } from "./_components/Dashboard/DashboardSummaryComingSoon";
import { categories } from "@/lib/config/categories";
import { fetchMonthlyKpi } from "@/lib/api/kpi";
import { getYearsFromMonthStrings } from "@/lib/date-utils";
import {
  buildMonthlyTableSections,
  buildMonthToRowIdMap,
} from "@/lib/logic/kpi-table-data";
import { buildSummaryYtdByCategory } from "@/lib/logic/kpi-card";

interface PageProps {
  searchParams: Promise<{ region?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isSummary =
    params.region !== "kr" && params.region !== "us";

  if (isSummary) {
    return <DashboardSummaryComingSoon />;
  }

  const region = params.region as "kr" | "us";
  const currentYear = new Date().getFullYear();

  let months: string[] = [];
  let sections: Awaited<ReturnType<typeof buildMonthlyTableSections>>["sections"] = [];
  let summaryYtd: Record<string, number> = { cm: 0, media: 0, ads: 0, "media-fee": 0 };
  let error: string | null = null;

  try {
    const rows = await fetchMonthlyKpi({ region });
    const built = buildMonthlyTableSections(rows);
    months = built.months;
    sections = built.sections.map((sec) => ({
      ...sec,
      monthToRowId: buildMonthToRowIdMap(rows, sec.category, built.months),
    }));
    summaryYtd = buildSummaryYtdByCategory(rows, currentYear);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load KPI data";
  }

  const initialYears = getYearsFromMonthStrings(months);
  const initialYear =
    params.year != null ? parseInt(params.year, 10) : currentYear;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPageClient
        categories={categories}
        initialMonths={months}
        initialSections={sections}
        initialSummaryYtd={summaryYtd}
        initialRegion={region}
        initialYears={initialYears}
        initialYear={initialYear}
        error={error}
      />
    </Suspense>
  );
}
