"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardSectionConfig } from "@/lib/config/dashboard-sections";
import {
  Bookmark,
  BarChart3,
  Megaphone,
  Receipt,
  DollarSign,
  Percent,
  Activity,
  Server,
} from "lucide-react";

const sectionIcons: Record<string, React.ReactNode> = {
  cm: <BarChart3 className="size-4" />,
  fr: <DollarSign className="size-4" />,
  ads: <Megaphone className="size-4" />,
  media: <Bookmark className="size-4" />,
  mfr: <Percent className="size-4" />,
  apc: <Activity className="size-4" />,
  scr: <Server className="size-4" />,
};

interface BookmarkTabsProps {
  /** 7 dashboard sections in display order (CM, FR, Ads, Media, MFR, APC, SCR). */
  sections: DashboardSectionConfig[];
  activeCategory: string | null;
  onCategoryClick: (id: string) => void;
}

export function BookmarkTabs({
  sections,
  activeCategory,
  onCategoryClick,
}: BookmarkTabsProps) {
  return (
    <div className="fixed left-0 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
      {sections.map((section) => {
        const isActive = activeCategory === section.id;
        return (
          <motion.button
            key={section.id}
            type="button"
            onClick={() => onCategoryClick(section.id)}
            initial={{ x: -60 }}
            animate={{ x: isActive ? 0 : -8 }}
            whileHover={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "group flex min-w-0 items-center gap-2 whitespace-nowrap rounded-r-lg border border-l-0 pl-4 pr-4 py-3 shadow-lg backdrop-blur-md transition-colors",
              isActive
                ? cn(section.color, "border-transparent text-sm font-medium text-background")
                : "border-glass-border bg-glass text-xs font-normal text-gray-400 hover:text-foreground dark:text-gray-500 dark:hover:text-foreground",
            )}
          >
            <span className="flex shrink-0 items-center gap-2">
              {sectionIcons[section.id] ?? <Activity className="size-4" />}
              <span className="truncate">{section.tabLabel}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
