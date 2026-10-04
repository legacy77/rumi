import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function safeNext(next: string | null): string {
  if (!next) return "/";
  // fail-closed: must be same-origin path, block open-redirect (//, \\, absolute).
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("\\")) return "/";
  return next;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const dest = safeNext(searchParams.get("next"));
  return NextResponse.redirect(`${origin}${dest}`);
}
