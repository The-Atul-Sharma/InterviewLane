export default function Loading() {
  return (
    <div className="container-page py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
      <div className="min-w-0 space-y-6">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-3 pt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${60 + ((i * 13) % 35)}%` }}
            />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-lg border bg-card" />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </aside>
    </div>
  );
}
