export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-8 space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </div>
  );
}
