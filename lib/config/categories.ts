/**
 * Dashboard category config (reference: temp/reference lib/dashboard-data).
 * Used by ControlBar, BookmarkTabs, summary cards. 41-data-structure: category = 'ads' | 'media'; here we also use 'cm' | 'media-fee' for UI grouping.
 */

export type CategoryId = "cm" | "media" | "ads" | "media-fee";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  shortLabel: string;
  color: string;
  lightColor: string;
  fgColor: string;
  borderColor: string;
  /** For progress bar and highlight gradients (e.g. from-mint/60 to-mint/30) */
  gradient: string;
}

export const categories: CategoryConfig[] = [
  {
    id: "cm",
    label: "Contribution Margin",
    shortLabel: "CM",
    color: "bg-mint",
    lightColor: "bg-mint-light",
    fgColor: "text-mint-foreground",
    borderColor: "border-mint",
    gradient: "from-mint/60 to-mint/30",
  },
  {
    id: "media",
    label: "Media",
    shortLabel: "Media",
    color: "bg-blue",
    lightColor: "bg-blue-light",
    fgColor: "text-blue-foreground",
    borderColor: "border-blue",
    gradient: "from-blue/60 to-blue/30",
  },
  {
    id: "ads",
    label: "Ads",
    shortLabel: "Ads",
    color: "bg-rose",
    lightColor: "bg-rose-light",
    fgColor: "text-rose-foreground",
    borderColor: "border-rose",
    gradient: "from-rose/60 to-rose/30",
  },
  {
    id: "media-fee",
    label: "Media Fee",
    shortLabel: "Fee",
    color: "bg-amber",
    lightColor: "bg-amber-light",
    fgColor: "text-amber-foreground",
    borderColor: "border-amber",
    gradient: "from-amber/60 to-amber/30",
  },
];

/** Resolve category label by id (for modals, headers). Falls back to id if not found. */
export function getCategoryLabel(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId;
}
