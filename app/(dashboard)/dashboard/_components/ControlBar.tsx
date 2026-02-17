"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CategoryConfig } from "@/lib/config/categories";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  categories: CategoryConfig[];
  activeFilter: string | null;
  onFilterChange: (value: string) => void;
}

export function ControlBar({
  categories,
  activeFilter,
  onFilterChange,
}: ControlBarProps) {
  return (
    <div className="sticky top-[57px] z-20 flex items-center justify-center border-b border-glass-border bg-glass px-6 py-2.5 backdrop-blur-xl">
      <ToggleGroup
        type="single"
        value={activeFilter ?? ""}
        onValueChange={(val) => onFilterChange(val)}
        className="gap-1 rounded-lg border border-glass-border bg-glass p-1 backdrop-blur-md"
      >
        {categories.map((cat) => (
          <ToggleGroupItem
            key={cat.id}
            value={cat.id}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-all",
              activeFilter === cat.id
                ? cn(cat.color, "text-background shadow-md")
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {cat.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
