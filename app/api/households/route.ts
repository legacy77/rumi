import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const { data } = await supabase
    .from("memberships")
    .select("role, households(id, nama)")
    .eq("user_id", user.id);
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const { nama } = await req.json();
  const { data: rumah } = await supabase
    .from("households")
    .insert({ nama, created_by: user.id })
    .select()
    .single();
  if (!rumah) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 400 });
  await supabase.from("memberships").insert({ user_id: user.id, household_id: rumah.id, role: "admin" });
  return NextResponse.json(rumah);
}
