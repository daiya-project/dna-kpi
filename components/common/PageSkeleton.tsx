import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton for loading states (e.g. Suspense fallback).
 * Reusable across dashboard and other pages with similar layout.
 */
export function PageSkeleton() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="border-b border-border bg-background/80 px-6 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
      </div>
      <div className="border-b border-border px-6 py-2.5">
        <div className="flex justify-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <main className="px-6 py-8 pl-14">
        <div className="mx-auto mb-8 grid max-w-7xl grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="mx-auto max-w-7xl space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </main>
    </div>
  );
}
