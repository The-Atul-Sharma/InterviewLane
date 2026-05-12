import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json({ isAdmin: isAdminEmail(user?.email) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
