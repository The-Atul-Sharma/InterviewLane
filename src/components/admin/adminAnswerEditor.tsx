"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenSquare, ClipboardPaste, Trash2 } from "lucide-react";
import type { Question } from "@/lib/schema/question";
import {
  CATEGORIES,
  DIFFICULTIES,
  FREQUENCIES,
  SENIORITY,
} from "@/lib/schema/question";
import { useAuth } from "@/components/providers/authProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LIST } from "@/lib/categories";

const PLACEHOLDER_MARKER = "awaiting an authored answer";

type CodeSnippet = { language: string; code: string; caption?: string };

type FormState = {
  title: string;
  category: string;
  subcategory: string;
  difficulty: string;
  frequency: string;
  seniority: string;
  shortDescription: string;
  answer: string;
  seniorDiscussion: string;
  followUps: string;
  commonMistakes: string;
  performanceConsiderations: string;
  edgeCases: string;
  realWorldExamples: string;
  relatedSlugs: string;
  codeSnippetsJson: string;
  estimatedReadingMinutes: number;
  estimatedSolvingMinutes: number;
};

function fromQuestion(q: Question): FormState {
  return {
    title: q.title,
    category: q.category,
    subcategory: q.subcategory ?? "",
    difficulty: q.difficulty,
    frequency: q.frequency,
    seniority: q.seniority,
    shortDescription: q.shortDescription,
    answer: q.answer,
    seniorDiscussion: q.seniorDiscussion ?? "",
    followUps: q.followUps.join("\n"),
    commonMistakes: q.commonMistakes.join("\n"),
    performanceConsiderations: q.performanceConsiderations.join("\n"),
    edgeCases: q.edgeCases.join("\n"),
    realWorldExamples: q.realWorldExamples.join("\n"),
    relatedSlugs: q.relatedSlugs.join("\n"),
    codeSnippetsJson:
      q.codeSnippets.length > 0 ? JSON.stringify(q.codeSnippets, null, 2) : "[]",
    estimatedReadingMinutes: q.estimatedReadingMinutes,
    estimatedSolvingMinutes: q.estimatedSolvingMinutes,
  };
}

function linesToArray(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function AdminAnswerEditor({
  question,
  isDeleted = false,
}: {
  question: Question;
  isDeleted?: boolean;
}) {
  const { isAdmin, ensureAdminChecked } = useAuth();
  const router = useRouter();
  React.useEffect(() => {
    void ensureAdminChecked();
  }, [ensureAdminChecked]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(() => fromQuestion(question));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState("");
  const [pasteInfo, setPasteInfo] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(fromQuestion(question));
      setError(null);
      setPasteOpen(false);
      setPasteText("");
      setPasteInfo(null);
      setConfirmDelete(false);
      setDeleting(false);
    }
  }, [open, question]);

  if (!isAdmin) return null;

  const isPlaceholder =
    !question.answer || question.answer.toLowerCase().includes(PLACEHOLDER_MARKER);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyAiJson = (raw: string) => {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      throw new Error("Expected a JSON object.");
    }
    const filled: string[] = [];
    setForm((prev) => {
      const next = { ...prev };
      if (typeof data.answer === "string") {
        next.answer = data.answer;
        filled.push("answer");
      }
      if (typeof data.seniorDiscussion === "string") {
        next.seniorDiscussion = data.seniorDiscussion;
        filled.push("seniorDiscussion");
      }
      if (Array.isArray(data.followUps)) {
        next.followUps = data.followUps.join("\n");
        filled.push("followUps");
      }
      if (Array.isArray(data.commonMistakes)) {
        next.commonMistakes = data.commonMistakes.join("\n");
        filled.push("commonMistakes");
      }
      if (Array.isArray(data.performanceConsiderations)) {
        next.performanceConsiderations = data.performanceConsiderations.join("\n");
        filled.push("performanceConsiderations");
      }
      if (Array.isArray(data.edgeCases)) {
        next.edgeCases = data.edgeCases.join("\n");
        filled.push("edgeCases");
      }
      if (Array.isArray(data.realWorldExamples)) {
        next.realWorldExamples = data.realWorldExamples.join("\n");
        filled.push("realWorldExamples");
      }
      if (Array.isArray(data.codeSnippets)) {
        next.codeSnippetsJson = JSON.stringify(data.codeSnippets, null, 2);
        filled.push("codeSnippets");
      }
      if (typeof data.estimatedReadingMinutes === "number") {
        next.estimatedReadingMinutes = data.estimatedReadingMinutes;
        filled.push("estimatedReadingMinutes");
      }
      if (typeof data.estimatedSolvingMinutes === "number") {
        next.estimatedSolvingMinutes = data.estimatedSolvingMinutes;
        filled.push("estimatedSolvingMinutes");
      }
      return next;
    });
    if (filled.length === 0) {
      throw new Error(
        "JSON didn't contain any recognised fields (answer, codeSnippets, followUps, …).",
      );
    }
    return filled;
  };

  const onPasteFromClipboard = async () => {
    setError(null);
    setPasteInfo(null);
    try {
      const raw = await navigator.clipboard.readText();
      const filled = applyAiJson(raw);
      setPasteOpen(false);
      setPasteText("");
      setPasteInfo(`Imported ${filled.length} field${filled.length === 1 ? "" : "s"} from clipboard.`);
    } catch (e) {
      setError(e instanceof Error ? `Couldn't import JSON: ${e.message}` : "Couldn't import JSON");
    }
  };

  const onApplyPastedJson = () => {
    setError(null);
    setPasteInfo(null);
    try {
      const filled = applyAiJson(pasteText);
      setPasteText("");
      setPasteOpen(false);
      setPasteInfo(`Imported ${filled.length} field${filled.length === 1 ? "" : "s"}.`);
    } catch (e) {
      setError(e instanceof Error ? `Couldn't import JSON: ${e.message}` : "Couldn't import JSON");
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${question.slug}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setOpen(false);
      router.push(`/categories/${question.category}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let codeSnippets: CodeSnippet[] = [];
      try {
        const parsed = JSON.parse(form.codeSnippetsJson || "[]");
        if (!Array.isArray(parsed)) throw new Error("codeSnippets must be an array");
        codeSnippets = parsed;
      } catch (e) {
        throw new Error(
          `Code snippets JSON is invalid: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }

      const payload = {
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory.trim() || null,
        difficulty: form.difficulty,
        frequency: form.frequency,
        seniority: form.seniority,
        shortDescription: form.shortDescription.trim(),
        answer: form.answer,
        codeSnippets,
        followUps: linesToArray(form.followUps),
        commonMistakes: linesToArray(form.commonMistakes),
        performanceConsiderations: linesToArray(form.performanceConsiderations),
        edgeCases: linesToArray(form.edgeCases),
        realWorldExamples: linesToArray(form.realWorldExamples),
        relatedSlugs: linesToArray(form.relatedSlugs),
        seniorDiscussion: form.seniorDiscussion.trim() || null,
        estimatedReadingMinutes: form.estimatedReadingMinutes,
        estimatedSolvingMinutes: form.estimatedSolvingMinutes,
      };

      const res = await fetch(`/api/admin/questions/${question.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = CATEGORY_LIST.filter((c) =>
    (CATEGORIES as readonly string[]).includes(c.slug),
  );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isPlaceholder ? "default" : "outline"}
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <PenSquare className="h-3.5 w-3.5" />
        {isPlaceholder ? "Add answer" : "Edit question"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
          <div className="flex max-h-[92vh] flex-col">
            <div className="border-b border-border px-6 py-4">
              <DialogTitle>
                {isPlaceholder ? "Add answer" : "Edit question"}
              </DialogTitle>
              <DialogDescription>
                Edit any field. List fields use one item per line. Markdown is
                supported in long-form fields.
              </DialogDescription>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <Section label="Metadata">
                <Field label="Title" required>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Short description" required>
                  <textarea
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Category" required>
                    <Select
                      value={form.category}
                      onValueChange={(v) => set("category", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Subcategory">
                    <input
                      value={form.subcategory}
                      onChange={(e) => set("subcategory", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Difficulty" required>
                    <Select
                      value={form.difficulty}
                      onValueChange={(v) => set("difficulty", v)}
                    >
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
                    <Select
                      value={form.frequency}
                      onValueChange={(v) => set("frequency", v)}
                    >
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
                    <Select
                      value={form.seniority}
                      onValueChange={(v) => set("seniority", v)}
                    >
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
                        max={180}
                        value={form.estimatedReadingMinutes}
                        onChange={(e) =>
                          set(
                            "estimatedReadingMinutes",
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Solving min">
                      <input
                        type="number"
                        min={1}
                        max={360}
                        value={form.estimatedSolvingMinutes}
                        onChange={(e) =>
                          set(
                            "estimatedSolvingMinutes",
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section
                label="Answer"
                trailing={
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPasteOpen((v) => !v)}
                      className="gap-1.5"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      {pasteOpen ? "Hide paste box" : "Paste JSON"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={onPasteFromClipboard}
                      className="gap-1.5"
                    >
                      From clipboard
                    </Button>
                  </div>
                }
              >
                {pasteOpen && (
                  <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={8}
                      spellCheck={false}
                      placeholder='Paste the AI JSON here, e.g. { "answer": "...", "codeSnippets": [...], ... }'
                      className={`${inputCls} resize-y font-mono text-[12px] leading-5`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        Imports answer, code snippets, follow-ups, common mistakes,
                        perf, edge cases, real-world examples, senior discussion,
                        and estimates. Other fields keep their current value.
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPasteText("");
                            setPasteInfo(null);
                          }}
                          disabled={!pasteText}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={onApplyPastedJson}
                          disabled={!pasteText.trim()}
                        >
                          Apply JSON
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {pasteInfo && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {pasteInfo}
                  </p>
                )}
                <Field
                  label="Answer (Markdown)"
                  required
                  hint={`${form.answer.length.toLocaleString()} chars`}
                >
                  <textarea
                    rows={14}
                    value={form.answer}
                    onChange={(e) => set("answer", e.target.value)}
                    className={`${inputCls} resize-y font-mono text-[13px] leading-6`}
                  />
                </Field>
                <Field
                  label="Code snippets (JSON array)"
                  hint='Array of { "language", "code", "caption?" }. Paste from the AI JSON output.'
                >
                  <textarea
                    rows={8}
                    value={form.codeSnippetsJson}
                    onChange={(e) => set("codeSnippetsJson", e.target.value)}
                    spellCheck={false}
                    className={`${inputCls} resize-y font-mono text-[12px] leading-5`}
                  />
                </Field>
              </Section>

              <Section label="Lists (one item per line)">
                <Field label="Follow-up questions">
                  <textarea
                    rows={4}
                    value={form.followUps}
                    onChange={(e) => set("followUps", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
                <Field label="Common mistakes">
                  <textarea
                    rows={4}
                    value={form.commonMistakes}
                    onChange={(e) => set("commonMistakes", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
                <Field label="Performance considerations">
                  <textarea
                    rows={3}
                    value={form.performanceConsiderations}
                    onChange={(e) =>
                      set("performanceConsiderations", e.target.value)
                    }
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
                <Field label="Edge cases">
                  <textarea
                    rows={3}
                    value={form.edgeCases}
                    onChange={(e) => set("edgeCases", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
                <Field label="Real-world examples">
                  <textarea
                    rows={3}
                    value={form.realWorldExamples}
                    onChange={(e) => set("realWorldExamples", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
                <Field
                  label="Related slugs"
                  hint="Slugs of related questions, one per line."
                >
                  <textarea
                    rows={3}
                    value={form.relatedSlugs}
                    onChange={(e) => set("relatedSlugs", e.target.value)}
                    className={`${inputCls} resize-y font-mono text-[12px] leading-5`}
                  />
                </Field>
              </Section>

              <Section label="Senior discussion">
                <Field label="Senior engineer discussion (Markdown)">
                  <textarea
                    rows={4}
                    value={form.seniorDiscussion}
                    onChange={(e) => set("seniorDiscussion", e.target.value)}
                    className={`${inputCls} resize-y leading-6`}
                  />
                </Field>
              </Section>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isDeleted ? (
                  <span className="text-xs text-muted-foreground">
                    Already deleted — use Restore question on the page.
                  </span>
                ) : confirmDelete ? (
                  <>
                    <span className="text-xs text-destructive">
                      Permanently soft-delete this question?
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={deleting}
                      onClick={onDelete}
                      className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Yes, delete
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={saving || deleting}
                    onClick={() => setConfirmDelete(true)}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete question
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving || deleting}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || deleting || form.answer.trim().length < 10}
                  onClick={onSave}
                  className="gap-1.5"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-foreground";

function Section({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        {trailing}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

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
