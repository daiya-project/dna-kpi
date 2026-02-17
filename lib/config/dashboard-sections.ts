/**
 * Dashboard table section order and labels (7 sections).
 * Used by BookmarkTabs, KpiTable, and page section ordering.
 */

export const DASHBOARD_SECTION_IDS = [
  "cm",
  "fr",
  "ads",
  "media",
  "mfr",
  "apc",
  "scr",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  /** Sidebar tab label (e.g. CM, FR, Ads). */
  tabLabel: string;
  /** Table section header title (e.g. Contribution Margin, AD Revenue). */
  sectionTitle: string;
  color: string;
  lightColor: string;
  fgColor: string;
  borderColor: string;
}

/** 7 sections in display order. Styling for header and bookmark active state. */
export const dashboardSections: DashboardSectionConfig[] = [
  {
    id: "cm",
    tabLabel: "CM",
    sectionTitle: "Contribution Margin",
    color: "bg-mint",
    lightColor: "bg-mint-light",
    fgColor: "text-mint-foreground",
    borderColor: "border-mint",
  },
  {
    id: "fr",
    tabLabel: "FR",
    sectionTitle: "Financial Revenue",
    color: "bg-violet-500",
    lightColor: "bg-violet-100",
    fgColor: "text-violet-700",
    borderColor: "border-violet-500",
  },
  {
    id: "ads",
    tabLabel: "Ads",
    sectionTitle: "AD Revenue",
    color: "bg-rose",
    lightColor: "bg-rose-light",
    fgColor: "text-rose-foreground",
    borderColor: "border-rose",
  },
  {
    id: "media",
    tabLabel: "Media",
    sectionTitle: "Media Revenue",
    color: "bg-blue",
    lightColor: "bg-blue-light",
    fgColor: "text-blue-foreground",
    borderColor: "border-blue",
  },
  {
    id: "mfr",
    tabLabel: "MFR",
    sectionTitle: "Media Fee Rate",
    color: "bg-amber",
    lightColor: "bg-amber-light",
    fgColor: "text-amber-foreground",
    borderColor: "border-amber",
  },
  {
    id: "apc",
    tabLabel: "APC",
    sectionTitle: "APC Rate",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-100",
    fgColor: "text-emerald-700",
    borderColor: "border-emerald-500",
  },
  {
    id: "scr",
    tabLabel: "SCR",
    sectionTitle: "Server Cost Rate",
    color: "bg-slate-500",
    lightColor: "bg-slate-100",
    fgColor: "text-slate-700",
    borderColor: "border-slate-500",
  },
];

export function getDashboardSectionConfig(
  id: string,
): DashboardSectionConfig | undefined {
  return dashboardSections.find((s) => s.id === id);
}
