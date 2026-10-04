import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const { data, error } = await supabase
    .from("memberships")
    .select("role, households(id, nama)")
    .eq("user_id", user.id);
  if (error) {
    const detail = process.env.NODE_ENV !== "production" ? { detail: `${error.code ?? "?"}: ${error.message}` } : {};
    return NextResponse.json({ error: "Gagal memuat rumah", ...detail }, { status: 500 });
  }
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
  const id = crypto.randomUUID();
  const { error: hErr } = await supabase
    .from("households")
    .insert({ id, nama: nama.trim(), created_by: user.id });
  if (hErr) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 400 });
  // Bootstrap admin via service-role: policy "pembuat jadi admin" checks
  // EXISTS (... households ... created_by = auth.uid()), but that subquery is
  // itself filtered by households SELECT RLS "member baca rumahnya" — and the
  // creator has NO membership row yet, so the EXISTS sees zero rows (42501).
  // Bypass with server-only service-role client after verifying ownership.
  const svc = serviceClient();
  const { data: created, error: cErr } = await svc
    .from("households")
    .select("id, created_by")
    .eq("id", id)
    .single();
  if (cErr || !created || created.created_by !== user.id) {
    return NextResponse.json({ error: "Gagal buat rumah" }, { status: 500 });
  }
  const { error: mErr } = await svc
    .from("memberships")
    .insert({ user_id: user.id, household_id: id, role: "admin", status: "active" });
  if (mErr) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 500 });
  const { data: rumah, error: rErr } = await supabase
    .from("households")
    .select()
    .eq("id", id)
    .single();
  if (rErr || !rumah) return NextResponse.json({ error: "Gagal buat rumah" }, { status: 500 });
  return NextResponse.json(rumah);
}
