import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPlans } from "@/lib/repository/roadmapRepository";
import { PageHero } from "@/components/pageHero";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Preparation Plans",
  description:
    "7-day crash plan, 30-day plan, 60-day deep plan, or 90-day senior plan. Pick the timeline that matches your interview.",
};

export default async function PlansPage() {
  const plans = (await getPlans()).slice().sort((a, b) => a.days - b.days);
  return (
    <div className="pb-20">
      <PageHero
        eyebrow="Plans"
        title="Pick your timeline."
        sub="Each plan generates a daily question rotation across the highest-frequency interview surfaces, with mock checkpoints and revision days built in."
      />
      <section className="container-page py-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => {
            const popular = p.slug === "30-day" || (plans.length > 1 && i === 1 && !plans.some((x) => x.slug === "30-day"));
            return (
              <Link
                key={p.slug}
                href={`/plans/${p.slug}`}
                className={`surface surface-hover relative flex flex-col gap-3 p-6 ${
                  popular ? "border-[hsl(var(--brand))]/60" : ""
                }`}
              >
                {popular && (
                  <span className="absolute -top-2 right-5 rounded-full bg-[hsl(var(--brand))] px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-white">
                    most picked
                  </span>
                )}
                <div className="font-serif text-[56px] italic leading-none">
                  {p.days}
                  <sup className="ml-1 font-mono text-[11px] font-medium not-italic text-muted-foreground">
                    days
                  </sup>
                </div>
                <h2 className="text-[17px] font-semibold tracking-tight">{p.name}</h2>
                <p className="line-clamp-3 text-[13px] leading-snug text-muted-foreground">
                  {p.tagline}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
                  <div>
                    <div className="text-[18px] font-semibold tabular-nums leading-none tracking-tight">
                      {p.questionsPerDay}
                      <span className="ml-1 font-mono text-[10px] font-medium text-muted-foreground">
                        /day
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[18px] font-semibold tabular-nums leading-none tracking-tight">
                      {p.days * p.questionsPerDay}
                      <span className="ml-1 font-mono text-[10px] font-medium text-muted-foreground">
                        total
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {p.focus.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </ul>

                <div className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-medium text-foreground">
                  Start plan <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
