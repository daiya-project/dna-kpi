"use client";

import { cn } from "@/lib/utils";
import type { CategoryConfig } from "@/lib/config/categories";

export interface KpiCardProps {
  category: Pick<CategoryConfig, "id" | "label" | "color" | "lightColor" | "borderColor" | "fgColor">;
  /** YTD value for this category (from buildSummaryYtdByCategory). */
  value: number;
  isActive: boolean;
  onSelect: () => void;
}

function formatYtdValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  if (value > 0) return `$${value.toFixed(0)}`;
  return "—";
}

export function KpiCard({ category, value, isActive, onSelect }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group rounded-xl border p-4 text-left backdrop-blur-md transition-all hover:shadow-lg",
        isActive
          ? `${category.lightColor} border-2 ${category.borderColor} shadow-lg`
          : "border-glass-border bg-glass hover:bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block size-2 rounded-full",
            category.color,
          )}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {category.label}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-bold tabular-nums",
          category.fgColor,
        )}
      >
        {formatYtdValue(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">YTD Total</p>
    </button>
  );
}
