import { Skeleton } from "@/components/ui/skeleton";

// Base shimmer effect via CSS animation applied globally in styles.css
// These components provide matching layouts to content pages

/** Header loader for main pages */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );
}

/** Match card skeleton for lists */
export function MatchCardSkeleton() {
  return (
    <div className="bg-card border border-brand-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Full match detail skeleton */
export function MatchDetailSkeleton() {
  return (
    <div className="space-y-5">
      {/* Back link */}
      <Skeleton className="h-5 w-20" />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-card to-jet-surface-2 border-2 border-brand-green rounded-xl p-5 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-8" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Value indicator */}
      <div className="bg-gradient-to-br from-teal-bg to-card border border-teal-accent/30 rounded-xl p-5">
        <Skeleton className="h-4 w-24 mx-auto" />
        <div className="flex justify-around mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-px" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Recent form section */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      {/* Match context section */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Team news */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>

      {/* Market overview */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>

      {/* All markets */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  );
}

/** Home page skeleton with multiple match cards */
export function HomePageSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Games list skeleton */
export function GamesListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Top picks page skeleton */
export function TopPicksSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

/** Record/profit page skeleton */
export function RecordPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      
      {/* Chart area */}
      <Skeleton className="h-64 w-full rounded-xl" />
      
      {/* Table */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Settings page skeleton */
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-8 w-32" />
      
      {/* Account section */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-brand-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** My picks page skeleton */
export function MyPicksSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

/** Auth page skeleton (login/signup) */
export function AuthPageSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>
      <div className="bg-card border border-brand-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}