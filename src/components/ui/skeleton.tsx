import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-3 w-64" />
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

export function InboxListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-transparent space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
  );
}
