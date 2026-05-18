"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/authProvider";
import { useUserStore } from "@/lib/store/userState";

const DUMMY_CELLS = (() => {
  const cols: number[][] = [];
  for (let w = 0; w < 26; w++) {
    const col: number[] = [];
    for (let d = 0; d < 7; d++) {
      const r = ((w * 7 + d) * 2654435761) >>> 0;
      const n = (r % 100) / 100;
      let lv = 0;
      if (n > 0.6) lv = 1;
      if (n > 0.78) lv = 2;
      if (n > 0.9) lv = 3;
      if (n > 0.97) lv = 4;
      if (w > 19 && lv > 0) lv = Math.min(4, lv + 1);
      col.push(lv);
    }
    cols.push(col);
  }
  return cols;
})();

export function HomeDashboardPreview({ totalPool }: { totalPool: number }) {
  const { user, loading } = useAuth();
  const hydrate = useUserStore((s) => s.hydrate);
  const hydrated = useUserStore((s) => s.hydrated);
  const streak = useUserStore((s) => s.streak);
  const completed = useUserStore((s) => s.completed);

  React.useEffect(() => {
    if (!loading && user) void hydrate();
  }, [loading, user, hydrate]);

  const signedIn = !!user && !loading;
  const showReal = signedIn && hydrated;

  const streakDays = showReal ? streak.days : 23;
  const completedCount = showReal ? completed.length : 147;
  const overallPct =
    showReal && totalPool > 0 ? Math.round((completed.length / totalPool) * 100) : 18;

  const cells = DUMMY_CELLS;

  const bgFor = (lv: number) => {
    switch (lv) {
      case 0: return "hsl(var(--secondary))";
      case 1: return "hsl(var(--brand) / 0.30)";
      case 2: return "hsl(var(--brand) / 0.55)";
      case 3: return "hsl(var(--brand) / 0.80)";
      default: return "hsl(var(--brand))";
    }
  };

  return (
    <div className="rounded-[20px] border bg-background p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-semibold tracking-tight">
            {signedIn ? "Your dashboard" : "Your dashboard preview"}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {signedIn
              ? "Live progress, streak, and 26-week activity."
              : "Sign in to start tracking your own streak and progress."}
          </p>
        </div>
        {signedIn ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              Open <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/login">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Day streak" value={streakDays.toString()} tone="warning" />
        <Stat label="Completed" value={completedCount.toString()} />
        <Stat label="Overall" value={`${overallPct}%`} />
      </div>

      <div className="mt-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          Last 26 weeks {signedIn ? "" : "· sample"}
        </span>
        <div className="mt-2 flex h-[60px] gap-[2px]">
          {cells.map((col, i) => (
            <div key={i} className="flex flex-1 flex-col gap-[2px]">
              {col.map((lv, j) => (
                <span
                  key={j}
                  className="flex-1 rounded-[1.5px]"
                  style={{ background: bgFor(lv) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>Less</span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div className="rounded-[10px] border bg-card px-4 py-3">
      <div
        className={`text-2xl font-semibold leading-none tracking-tight ${
          tone === "warning" ? "text-[hsl(var(--warning))]" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
