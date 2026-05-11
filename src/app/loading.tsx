export default function Loading() {
  return (
    <div className="container-page py-20">
      <div className="space-y-4">
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    </div>
  );
}
