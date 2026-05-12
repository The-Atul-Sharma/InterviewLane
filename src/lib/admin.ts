import "server-only";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!ADMIN_EMAIL) return false;
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/** Substring that marks a question's `answer` as a placeholder still
 *  awaiting an authored response. Kept in one place so we can change it later. */
export const PLACEHOLDER_ANSWER_MARKER = "awaiting an authored answer";

/** Categories hidden from the admin answers list (handled separately). */
export const ADMIN_HIDDEN_CATEGORIES = ["dsa-algorithms-75", "dsa-algorithms-169"] as const;
