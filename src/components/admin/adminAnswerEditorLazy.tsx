"use client";
/**
 * Admin-gated lazy wrapper for the answer editor. The 700+ line editor only
 * downloads once `useAuth().isAdmin === true`, so regular readers never get
 * the JS in their question-page bundle.
 */
import * as React from "react";
import dynamic from "next/dynamic";
import type { Question } from "@/lib/schema/question";
import { useAuth } from "@/components/providers/authProvider";

const AdminAnswerEditor = dynamic(
  () => import("@/components/admin/adminAnswerEditor").then((m) => m.AdminAnswerEditor),
  { ssr: false, loading: () => null },
);

export function AdminAnswerEditorLazy(props: { question: Question; isDeleted?: boolean }) {
  const { isAdmin, ensureAdminChecked } = useAuth();
  React.useEffect(() => {
    void ensureAdminChecked();
  }, [ensureAdminChecked]);
  if (!isAdmin) return null;
  return <AdminAnswerEditor {...props} />;
}
