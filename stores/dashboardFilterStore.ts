/**
 * Dashboard filter state. 00-project-main: Zustand, one store per file.
 * Sync with URL (searchParams) where possible for shareable links.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type RegionFilter = "summary" | "kr" | "us";

interface DashboardFilterState {
  region: RegionFilter;
  year: number;
  /** 1..4 */
  quarter: number | null;
  /** 1..12 */
  month: number | null;
  setRegion: (r: RegionFilter) => void;
  setYear: (y: number) => void;
  setQuarter: (q: number | null) => void;
  setMonth: (m: number | null) => void;
  /** For API: country filter when region is kr/us */
  country: "kr" | "us" | null;
}

export const useDashboardFilterStore = create<DashboardFilterState>()(
  devtools(
    (set) => ({
      region: "summary",
      year: new Date().getFullYear(),
      quarter: null,
      month: null,
      country: null,
      setRegion: (region) =>
        set({
          region,
          country:
            region === "kr" ? "kr" : region === "us" ? "us" : null,
        }),
      setYear: (year) => set({ year }),
      setQuarter: (quarter) => set({ quarter }),
      setMonth: (month) => set({ month }),
    }),
    { name: "dashboard-filter" },
  ),
);
