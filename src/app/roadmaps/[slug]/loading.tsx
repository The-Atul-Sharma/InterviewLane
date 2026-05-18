export default function Loading() {
  return (
    <div className="container-page space-y-8 py-10">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </div>
  );
}
