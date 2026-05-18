"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/providers/authProvider";

const AdminRestoreQuestion = dynamic(
  () =>
    import("@/components/admin/adminRestoreQuestion").then(
      (m) => m.AdminRestoreQuestion,
    ),
  { ssr: false, loading: () => null },
);

export function AdminRestoreQuestionLazy(props: { slug: string }) {
  const { isAdmin, ensureAdminChecked } = useAuth();
  React.useEffect(() => {
    void ensureAdminChecked();
  }, [ensureAdminChecked]);
  if (!isAdmin) return null;
  return <AdminRestoreQuestion {...props} />;
}
