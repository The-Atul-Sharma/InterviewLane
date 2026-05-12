"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LIST } from "@/lib/categories";
import {
  DIFFICULTIES,
  FREQUENCIES,
  SENIORITY,
} from "@/lib/schema/question";

const HIDDEN_CATS = new Set(["dsa-algorithms-75", "dsa-algorithms-169"]);
const CATEGORY_OPTIONS = CATEGORY_LIST.filter((c) => !HIDDEN_CATS.has(c.slug));

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function AdminNewQuestionPage() {
  return (
    <AdminGuard>
      <NewQuestionForm />
    </AdminGuard>
  );
}

function NewQuestionForm() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [category, setCategory] = React.useState<string>("javascript");
  const [subcategory, setSubcategory] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<string>("medium");
  const [frequency, setFrequency] = React.useState<string>("medium");
  const [seniority, setSeniority] = React.useState<string>("mid");
  const [shortDescription, setShortDescription] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [reading, setReading] = React.useState(5);
  const [solving, setSolving] = React.useState(5);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          category,
          subcategory: subcategory || undefined,
          difficulty,
          frequency,
          seniority,
          shortDescription,
          answer: answer || undefined,
          estimatedReadingMinutes: reading,
          estimatedSolvingMinutes: solving,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      router.push(`/questions/${json.slug}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create question");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    !!title.trim() &&
    !!slug.trim() &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    shortDescription.trim().length >= 10 &&
    !saving;

  return (
    <div className="container-page py-10">
      <Link
        href="/admin/answers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to admin
      </Link>

      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Add question</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create a new question. Leave the answer blank to seed a placeholder you
          can author later from the question page.
        </p>
      </header>

      <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Explain hydration mismatch in React"
            className={inputCls}
          />
        </Field>

        <Field
          label="Slug"
          required
          hint="Lowercase, kebab-case. Auto-generated from title — edit if needed."
        >
          <div className="flex gap-2">
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className={inputCls}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSlugTouched(false);
                setSlug(slugify(title));
              }}
              className="gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category" required>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Subcategory" hint="Optional free-text grouping.">
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. hooks"
              className={inputCls}
            />
          </Field>

          <Field label="Difficulty" required>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Frequency" required>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Seniority" required>
            <Select value={seniority} onValueChange={setSeniority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITY.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Reading min">
              <input
                type="number"
                min={1}
                max={120}
                value={reading}
                onChange={(e) => setReading(parseInt(e.target.value, 10) || 1)}
                className={inputCls}
              />
            </Field>
            <Field label="Solving min">
              <input
                type="number"
                min={1}
                max={120}
                value={solving}
                onChange={(e) => setSolving(parseInt(e.target.value, 10) || 1)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <Field label="Short description" required hint="1–2 sentences shown on cards.">
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={3}
            required
            minLength={10}
            placeholder="What the question is really testing, in one or two sentences."
            className={`${inputCls} resize-y leading-6`}
          />
        </Field>

        <Field
          label="Answer (optional)"
          hint="Leave blank to seed a placeholder — you can author it later from the question page."
        >
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={10}
            placeholder="# Answer..."
            className={`${inputCls} resize-y font-mono leading-6`}
          />
        </Field>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create question
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-foreground";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
