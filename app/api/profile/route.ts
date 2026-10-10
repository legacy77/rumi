import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/profile — profil sendiri.
// Selalu 200 dengan { user_id, nama }; nama "" kalau belum pernah diisi.
export async function GET() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { data: profil, error } = await supabase
    .from("profiles")
    .select("nama")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });

  return NextResponse.json({
    user_id: user.id,
    nama: profil?.nama?.trim() ?? "",
  });
}

// POST /api/profile — simpan/ubah nama sendiri.
export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan nggak jelas" }, { status: 400 });
  }

  const nama = body?.nama;
  if (typeof nama !== "string" || !nama.trim()) {
    return NextResponse.json({ error: "Nama nggak boleh kosong" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, nama: nama.trim() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Gagal simpan nama" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
