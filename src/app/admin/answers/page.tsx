import { Suspense } from "react";
import { AdminGuard } from "@/components/admin/adminGuard";
import { AdminAnswersList } from "@/components/admin/adminAnswersList";

export const dynamic = "force-dynamic";

export default function AdminAnswersPage() {
  return (
    <AdminGuard>
      <div className="container-page py-10">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Add answers</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Browse every question (excluding DSA) and author the ones still awaiting
            an answer. Filter by category and status, then open a question to write
            its answer.
          </p>
        </header>
        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">Loading…</div>
          }
        >
          <AdminAnswersList />
        </Suspense>
      </div>
    </AdminGuard>
  );
}
