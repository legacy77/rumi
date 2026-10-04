import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const { data, error } = await supabase
    .from("memberships")
    .select("role, households(id, nama)")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Gagal memuat rumah" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  let nama: unknown;
  try {
    ({ nama } = await req.json());
  } catch {
    return NextResponse.json({ error: "Nama rumah wajib" }, { status: 400 });
  }
  if (typeof nama !== "string" || nama.trim() === "") {
    return NextResponse.json({ error: "Nama rumah wajib" }, { status: 400 });
  }
  const { data: rumah, error: hErr } = await supabase
    .from("households")
    .insert({ nama: nama.trim(), created_by: user.id })
    .select()
    .single();
  if (hErr || !rumah) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 400 });
  const { error: mErr } = await supabase
    .from("memberships")
    .insert({ user_id: user.id, household_id: rumah.id, role: "admin" });
  if (mErr) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 500 });
  return NextResponse.json(rumah);
}
