"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import { useDashboardFilterStore } from "@/stores/dashboardFilterStore";

/**
 * Shown when region is "summary". Summary region is planned for later;
 * no data input/editing on this view. User can switch to KR or US via header tabs or buttons.
 */
export function DashboardSummaryComingSoon() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setRegion: setStoreRegion } = useDashboardFilterStore();

  const updateUrl = useCallback(
    (region: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (region === "summary") next.delete("region");
      else next.set("region", region);
      router.push(`/dashboard?${next.toString()}`);
    },
    [router, searchParams],
  );

  const handleRegionChange = useCallback(
    (newRegion: string) => {
      setStoreRegion(newRegion as "summary" | "kr" | "us");
      updateUrl(newRegion);
    },
    [setStoreRegion, updateUrl],
  );

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-1/4 size-80 rounded-full bg-mint/15 blur-3xl" />
        <div className="absolute top-1/3 -left-20 size-60 rounded-full bg-blue/15 blur-3xl" />
      </div>
      <div className="relative z-10">
        <DashboardHeader
          activeRegion="summary"
          onRegionChange={handleRegionChange}
        />
        <main className="px-6 py-8 pl-14">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-6 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Construction className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Summary 리전은 추후 구현 예정입니다.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                KR 또는 US 리전을 선택하면 KPI 대시보드를 이용할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleRegionChange("kr")}
              >
                KR 보기
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRegionChange("us")}
              >
                US 보기
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
