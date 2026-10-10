import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function resolveNama(svc: any, user_id: string): Promise<string> {
  // 1) baca dari profiles (service-role)
  const { data: profil, error: pErr } = await svc
    .from("profiles")
    .select("nama")
    .eq("user_id", user_id)
    .maybeSingle();
  if (!pErr && profil?.nama && profil.nama.trim()) {
    return profil.nama.trim();
  }
  // 2) fallback ke prefix email lewat admin API
  try {
    const { data: authData, error: aErr } = await svc.auth.admin.getUserById(user_id);
    if (!aErr && authData?.user?.email) {
      const pre = authData.user.email.split("@")[0];
      if (pre) return pre;
    }
  } catch {
    /* kosong, lanjut ke default */
  }
  // 3) terakhir: label Generik — JANGAN pernah kembalikan UUID.
  return "Anggota";
}

// GET /api/members?household_id=xxx — daftar anggota rumah.
// Mengembalikan array { user_id, nama, role }. Nama TIDAK pernah UUID mentah.
export async function GET(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const household_id = searchParams.get("household_id");
  if (!household_id) return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  const { data: saya } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!saya) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });

  const svc = serviceClient();
  const { data, error } = await svc
    .from("memberships")
    .select("user_id, role")
    .eq("household_id", household_id)
    .eq("status", "active");
  if (error) return NextResponse.json({ error: "Gagal memuat anggota" }, { status: 500 });

  const daftar = (data ?? []) as Array<{ user_id: string; role: string }>;
  const res = await Promise.all(
    daftar.map(async (m) => ({
      user_id: m.user_id,
      nama: await resolveNama(svc, m.user_id),
      role: m.role,
    }))
  );
  return NextResponse.json(res);
}

// PATCH /api/members — ubah peran anggota (admin only).
export async function PATCH(req: Request) {
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

  const household_id = body?.household_id;
  const user_id = body?.user_id;
  const role = body?.role;

  if (
    typeof household_id !== "string" ||
    household_id.trim() === "" ||
    typeof user_id !== "string" ||
    user_id.trim() === "" ||
    typeof role !== "string" ||
    role.trim() === ""
  ) {
    return NextResponse.json({ error: "household_id, user_id, dan role wajib" }, { status: 400 });
  }
  if (!UUID_V4_RE.test(household_id) || !UUID_V4_RE.test(user_id)) {
    return NextResponse.json({ error: "household_id, user_id, dan role wajib" }, { status: 400 });
  }
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Role nggak valid, pilih admin atau member aja" }, { status: 400 });
  }

  const { data: saya } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!saya || saya.role !== "admin") {
    return NextResponse.json({ error: "Cuma admin yang bisa ubah peran anggota" }, { status: 403 });
  }

  // Larang admin menurunkan diri sendiri saat masih satu-satunya admin.
  if (user_id === user.id && role === "member") {
    const svc = serviceClient();
    const { count, error: cErr } = await svc
      .from("memberships")
      .select("role", { count: "exact", head: true })
      .eq("household_id", household_id)
      .eq("role", "admin")
      .eq("status", "active");
    if (cErr) return NextResponse.json({ error: "Gagal cek admin" }, { status: 500 });
    if (count === 1) {
      return NextResponse.json({ error: "Admin terakhir nggak bisa diturunkan sendiri" }, { status: 403 });
    }
  }

  const svc = serviceClient();
  const { error } = await svc
    .from("memberships")
    .update({ role })
    .eq("user_id", user_id)
    .eq("household_id", household_id);
  if (error) return NextResponse.json({ error: "Gagal ubah peran" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST /api/members — diri sendiri keluar dari rumah.
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
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }

  const household_id = body?.household_id;
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (!UUID_V4_RE.test(household_id)) {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }

  // Harus anggota aktif rumah ini.
  const { data: saya } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!saya) return NextResponse.json({ error: "Bukan anggota aktif rumah ini" }, { status: 403 });

  // Jika admin: larang keluar saat masih satu-satunya admin.
  if (saya.role === "admin") {
    const svc = serviceClient();
    const { count, error: cErr } = await svc
      .from("memberships")
      .select("role", { count: "exact", head: true })
      .eq("household_id", household_id)
      .eq("role", "admin")
      .eq("status", "active");
    if (cErr) return NextResponse.json({ error: "Gagal cek admin" }, { status: 500 });
    if (count === 1) {
      return NextResponse.json({ error: "Admin terakhir nggak bisa keluar, angkat admin lain dulu" }, { status: 400 });
    }
  }

  const svc = serviceClient();
  const { error: taskErr } = await svc
    .from("tasks")
    .update({ assignee_id: null })
    .eq("household_id", household_id)
    .eq("assignee_id", user.id);
  if (taskErr) return NextResponse.json({ error: "Gagal keluar dari rumah" }, { status: 500 });

  const { error: delErr } = await svc
    .from("memberships")
    .delete()
    .eq("user_id", user.id)
    .eq("household_id", household_id);
  if (delErr) return NextResponse.json({ error: "Gagal keluar dari rumah" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/members — admin mengekarkan anggota lain. (tetap)
export async function DELETE(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "household_id dan user_id wajib" }, { status: 400 });
  }
  const household_id = body?.household_id;
  const user_id = body?.user_id;
  if (
    typeof household_id !== "string" ||
    household_id.trim() === "" ||
    typeof user_id !== "string" ||
    user_id.trim() === ""
  ) {
    return NextResponse.json({ error: "household_id dan user_id wajib" }, { status: 400 });
  }
  if (!UUID_V4_RE.test(household_id) || !UUID_V4_RE.test(user_id)) {
    return NextResponse.json({ error: "household_id dan user_id wajib" }, { status: 400 });
  }

  const { data: saya } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!saya || saya.role !== "admin") {
    return NextResponse.json({ error: "Cuma admin yang bisa keluarkan anggota" }, { status: 403 });
  }

  if (user_id === user.id) {
    return NextResponse.json({ error: "Nggak bisa keluarkan diri sendiri" }, { status: 403 });
  }

  const svc = serviceClient();
  const { data: target } = await svc
    .from("memberships")
    .select("role")
    .eq("user_id", user_id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Anggota nggak ketemu" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin lain nggak bisa dikeluarkan" }, { status: 403 });
  }

  const { error: taskErr } = await svc
    .from("tasks")
    .update({ assignee_id: null })
    .eq("household_id", household_id)
    .eq("assignee_id", user_id);
  if (taskErr) return NextResponse.json({ error: "Gagal keluarkan anggota" }, { status: 500 });

  const { error: delErr } = await svc
    .from("memberships")
    .delete()
    .eq("user_id", user_id)
    .eq("household_id", household_id);
  if (delErr) return NextResponse.json({ error: "Gagal keluarkan anggota" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
