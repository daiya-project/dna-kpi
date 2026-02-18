"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardHeader } from "./DashboardHeader";
import { BookmarkTabs } from "../BookmarkTabs";
import { KpiCard } from "../KpiTable/KpiCard";
import { KpiTable } from "../KpiTable/KpiTable";
import type { CategoryConfig } from "@/lib/config/categories";
import {
  DASHBOARD_SECTION_IDS,
  dashboardSections,
  getDashboardSectionConfig,
} from "@/lib/config/dashboard-sections";
import type { MonthlyTableSection } from "@/lib/logic/kpi-table-data";
import { createEmptySection } from "@/lib/logic/kpi-table-data";
import { categories } from "@/lib/config/categories";
import type { TableSectionConfig } from "../KpiTable/KpiTable";
import { useDashboardFilterStore } from "@/stores/dashboardFilterStore";

interface DashboardPageClientProps {
  categories: CategoryConfig[];
  initialMonths: string[];
  initialSections: MonthlyTableSection[];
  initialSummaryYtd: Record<string, number>;
  initialRegion: string;
  /** Available years from data (for navigator bounds). */
  initialYears: number[];
  /** Year to scroll to on mount and to show in navigator when no scroll spy yet. */
  initialYear: number;
  error: string | null;
}

/** Section config for KpiTable (label = section title). Works for all 7 dashboard section ids. */
function getSectionConfig(id: string): TableSectionConfig | undefined {
  const s = getDashboardSectionConfig(id);
  if (!s) return undefined;
  return {
    id: s.id,
    label: s.sectionTitle,
    color: s.color,
    lightColor: s.lightColor,
    fgColor: s.fgColor,
    borderColor: s.borderColor,
  };
}

export function DashboardPageClient({
  categories: categoriesProp,
  initialMonths,
  initialSections,
  initialSummaryYtd,
  initialRegion,
  initialYears,
  initialYear,
  error,
}: DashboardPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setRegion: setStoreRegion } = useDashboardFilterStore();

  const months = Array.isArray(initialMonths) ? initialMonths : [];
  const years = Array.isArray(initialYears) ? initialYears : [];
  const sectionMap = new Map(
    (Array.isArray(initialSections) ? initialSections : []).map((s) => [s.category, s]),
  );
  const orderedSections = DASHBOARD_SECTION_IDS.map((id) =>
    sectionMap.get(id) ?? createEmptySection(id, months),
  );
  const region = initialRegion === "kr" || initialRegion === "us" ? initialRegion : "summary";

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeScrollCategory, setActiveScrollCategory] = useState<string | null>(null);
  const [focusedYear, setFocusedYear] = useState(() => {
    const y = initialYear;
    if (years.length === 0) return y;
    const clamped = Math.max(years[0]!, Math.min(years[years.length - 1]!, y));
    return clamped;
  });
  const sectionRefs = useRef<Record<string, HTMLTableSectionElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const updateUrl = useCallback(
    (updates: { region?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.region !== undefined) {
        if (updates.region === "summary") next.delete("region");
        else next.set("region", updates.region);
      }
      router.push(`/dashboard?${next.toString()}`);
    },
    [router, searchParams],
  );

  const handleRegionChange = useCallback(
    (newRegion: string) => {
      setStoreRegion(newRegion as "summary" | "kr" | "us");
      updateUrl({ region: newRegion });
    },
    [setStoreRegion, updateUrl],
  );

  const scrollToYear = useCallback((year: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`#col-year-${year}`) as HTMLElement | null;
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetLeft = elRect.left - containerRect.left + container.scrollLeft;
    container.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter((prev) => (prev === value || value === "" ? null : value));
    const el = document.getElementById(`section-${value}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleBookmarkClick = useCallback((id: string) => {
    setActiveFilter(id);
    const el = document.getElementById(`section-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Scroll spy (vertical): which category section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const sorted = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
          const id = sorted[0].target.id.replace("section-", "");
          setActiveScrollCategory(id);
        }
      },
      { rootMargin: "-120px 0px -50% 0px", threshold: 0 },
    );

    const refs = sectionRefs.current;
    Object.values(refs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      Object.values(refs).forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [orderedSections.length]);

  // Scroll spy (horizontal): update focused year from table scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || years.length === 0) return;

    const updateFocusedYear = () => {
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const mid = scrollLeft + container.clientWidth / 2;
      let best = years[0]!;
      for (const y of years) {
        const el = container.querySelector(`#col-year-${y}`) as HTMLElement | null;
        if (!el) continue;
        const elRect = el.getBoundingClientRect();
        const posInContent = elRect.left - containerRect.left + scrollLeft;
        if (posInContent <= mid) best = y;
      }
      setFocusedYear(best);
    };

    container.addEventListener("scroll", updateFocusedYear, { passive: true });
    updateFocusedYear();
    return () => container.removeEventListener("scroll", updateFocusedYear);
  }, [years]);

  // Initial scroll to initialYear when table is ready
  useEffect(() => {
    if (years.length === 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`#col-year-${initialYear}`) as HTMLElement | null;
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetLeft = elRect.left - containerRect.left + container.scrollLeft;
    container.scrollLeft = targetLeft;
  }, [initialYear, years.length]);

  const handleYearPrev = useCallback(() => {
    const idx = years.indexOf(focusedYear);
    if (idx > 0) {
      const y = years[idx - 1]!;
      setFocusedYear(y);
      scrollToYear(y);
    }
  }, [focusedYear, years, scrollToYear]);

  const handleYearNext = useCallback(() => {
    const idx = years.indexOf(focusedYear);
    if (idx >= 0 && idx < years.length - 1) {
      const y = years[idx + 1]!;
      setFocusedYear(y);
      scrollToYear(y);
    }
  }, [focusedYear, years, scrollToYear]);

  const displayedActiveCategory = activeFilter ?? activeScrollCategory;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Decorative background blurs (reference) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-1/4 size-80 rounded-full bg-mint/15 blur-3xl" />
        <div className="absolute top-1/3 -left-20 size-60 rounded-full bg-blue/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 size-72 rounded-full bg-rose/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 size-56 rounded-full bg-amber/15 blur-3xl" />
      </div>
      <div className="relative z-10">
        <DashboardHeader
          activeRegion={region}
          onRegionChange={handleRegionChange}
          yearNavigator={
            years.length > 0
              ? {
                  years,
                  focusedYear,
                  onPrev: handleYearPrev,
                  onNext: handleYearNext,
                }
              : undefined
          }
        />
        <BookmarkTabs
          sections={dashboardSections}
          activeCategory={displayedActiveCategory}
          onCategoryClick={handleBookmarkClick}
        />
        <main className="px-6 py-8 pl-14">
          {error && (
            <div className="mx-auto max-w-6xl rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mx-auto mb-8 grid max-w-7xl grid-cols-4 gap-4">
            {categoriesProp.map((cat) => (
              <KpiCard
                key={cat.id}
                category={cat}
                value={initialSummaryYtd[cat.id] ?? 0}
                isActive={activeFilter === cat.id}
                onSelect={() => handleFilterChange(cat.id)}
              />
            ))}
          </div>

          <KpiTable
            months={months}
            sections={orderedSections}
            activeFilter={activeFilter}
            sectionRefs={sectionRefs}
            getCategoryConfig={getSectionConfig}
            scrollContainerRef={scrollContainerRef}
          />

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Region:{" "}
            <span className="font-medium text-foreground">
              {region === "summary"
                ? "All Regions"
                : region.toUpperCase()}
            </span>
            {" · Continuous scroll "}
            {years.length > 0 && (
              <>
                <span className="font-medium text-foreground">
                  {years[0]}–{years[years.length - 1]}
                </span>
                {" · "}
              </>
            )}
            Data from lib/api
          </div>
        </main>
      </div>
    </div>
  );
}
