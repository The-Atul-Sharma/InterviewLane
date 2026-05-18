import * as React from "react";

/**
 * Section header used at the top of listing pages (Categories, Plans, Roadmaps,
 * Resources). Mirrors the home-page hero treatment: grid background, soft
 * radial brand glow, mono eyebrow, large headline, muted sub.
 */
export function PageHero({
  eyebrow,
  title,
  titleDim,
  sub,
  actions,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  titleDim?: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="grid-bg-lines absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--brand-glow)) 0%, transparent 70%)",
        }}
      />
      <div className="container-page relative flex flex-col gap-5 py-16 sm:py-20">
        <span className="eyebrow-brand">{eyebrow}</span>
        <h1 className="max-w-[22ch] text-balance text-4xl font-semibold leading-[1.02] tracking-extra-tight sm:text-5xl lg:text-6xl">
          {title}
          {titleDim ? <span className="text-muted-foreground"> {titleDim}</span> : null}
        </h1>
        {sub ? (
          <p className="max-w-[58ch] text-[15px] leading-6 text-muted-foreground sm:text-[16px]">
            {sub}
          </p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}
