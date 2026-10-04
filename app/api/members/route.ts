import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
  return NextResponse.json((data ?? []).map((m: any) => ({ nama: m.user_id, role: m.role })));
}

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
