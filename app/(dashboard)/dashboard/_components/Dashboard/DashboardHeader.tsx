"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  activeRegion: string;
  onRegionChange: (region: string) => void;
  /** Year navigator: stepper [<] year [>] — scrolls table to that year, no data reload */
  yearNavigator?: {
    years: number[];
    focusedYear: number;
    onPrev: () => void;
    onNext: () => void;
  };
}

const REGIONS = [
  { value: "summary", label: "Summary" },
  { value: "kr", label: "KR" },
  { value: "us", label: "US" },
] as const;

export function DashboardHeader({
  activeRegion,
  onRegionChange,
  yearNavigator,
}: DashboardHeaderProps) {
  const hasYears =
    yearNavigator &&
    Array.isArray(yearNavigator.years) &&
    yearNavigator.years.length > 0;
  const years = yearNavigator?.years ?? [];
  const focusedYear = yearNavigator?.focusedYear ?? new Date().getFullYear();
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const canGoPrev =
    hasYears && minYear != null && focusedYear > minYear;
  const canGoNext =
    hasYears && maxYear != null && focusedYear < maxYear;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      {/* Same width and horizontal alignment as KPI table (match main: pl-14 pr-6, max-w-7xl) */}
      <div className="mx-auto max-w-7xl pl-14 pr-6">
        <div className="flex items-center justify-between py-3">
          {/* Left: title — aligns with table left edge */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                KPI Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Performance Overview
              </p>
            </div>
          </div>

          {/* Right: [Tabs] then < Year > — aligns with table right edge */}
          <div className="flex items-center gap-6">
            {/* Pipe-separator style tabs */}
            <nav role="tablist" aria-label="Region" className="flex items-center gap-0">
              {REGIONS.map((r, i) => (
                <span key={r.value} className="flex items-center gap-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRegion === r.value}
                    onClick={() => onRegionChange(r.value)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all duration-300",
                      "text-muted-foreground hover:text-foreground",
                      activeRegion === r.value && [
                        "bg-primary/10 text-primary font-semibold shadow-sm backdrop-blur-md",
                      ],
                    )}
                  >
                    {r.label}
                  </button>
                  {i < REGIONS.length - 1 && (
                    <span
                      className="px-1.5 text-muted-foreground/30 select-none"
                      aria-hidden
                    >
                      |
                    </span>
                  )}
                </span>
              ))}
            </nav>

            {hasYears && (
              <div
                className="flex items-center gap-0 rounded-lg border border-glass-border bg-glass px-1 py-0.5 backdrop-blur-md"
                role="group"
                aria-label="Year navigator"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={yearNavigator!.onPrev}
                  disabled={!canGoPrev}
                  aria-label="Previous year"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[3rem] px-2 text-center font-mono text-sm font-semibold tabular-nums text-foreground">
                  {focusedYear}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={yearNavigator!.onNext}
                  disabled={!canGoNext}
                  aria-label="Next year"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
