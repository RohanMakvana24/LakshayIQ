export function PageLoader({ label }: { label?: string } = {}) {
  return (
    <div className="w-full py-2 animate-pulse space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-3.5 w-16 bg-muted-foreground/10 rounded-md" />
        <span className="text-muted-foreground/20 text-xs">/</span>
        <div className="h-3.5 w-24 bg-muted-foreground/10 rounded-md" />
        <span className="text-muted-foreground/20 text-xs">/</span>
        <div className="h-3.5 w-20 bg-muted-foreground/10 rounded-md" />
      </div>

      {/* Hero Section skeleton */}
      <div className="relative rounded-2xl border border-border/60 bg-muted/20 dark:bg-card/20 overflow-hidden mb-6 h-48 flex items-center p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="space-y-3 flex-1">
            <div className="h-5 w-24 bg-muted-foreground/10 rounded-full" />
            <div className="h-8 w-64 bg-muted-foreground/15 rounded-md" />
            <div className="h-4 w-3/4 max-w-xl bg-muted-foreground/10 rounded-md" />
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="h-10 w-24 bg-muted-foreground/10 rounded-2xl" />
            <div className="h-10 w-24 bg-muted-foreground/10 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Search & Controls Bar skeleton */}
      <div className="bg-card/70 border border-border/60 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 mb-5">
        <div className="h-9 bg-muted-foreground/10 rounded-lg flex-1 w-full" />
        <div className="h-9 w-full sm:w-36 bg-muted-foreground/10 rounded-lg" />
      </div>

      {/* Showing results count placeholder */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-3.5 w-32 bg-muted-foreground/10 rounded-md" />
      </div>

      {/* Cards Grid skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-border/60 rounded-2xl p-5 space-y-4 bg-card/50">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-muted-foreground/10" />
              <div className="h-5 w-16 rounded bg-muted-foreground/10" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-5/6 bg-muted-foreground/15 rounded-md" />
              <div className="h-3 w-full bg-muted-foreground/10 rounded-md" />
              <div className="h-3 w-2/3 bg-muted-foreground/10 rounded-md" />
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
              <div className="h-3.5 w-14 bg-muted-foreground/10 rounded-md" />
              <div className="h-4 w-4 bg-muted-foreground/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
