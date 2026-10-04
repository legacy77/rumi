import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

async function activeMembership(supabase: any, userId: string, household_id: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("household_id", household_id)
    .eq("status", "active")
    .single();
  if (error || !data) return null;
  return data;
}

export async function GET(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login, login dulu ya" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const household_id = searchParams.get("household_id");
  if (!household_id) return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { data, error } = await supabase
    .from("tasks")
    .select("id, judul, status, assignee_id, deadline")
    .eq("household_id", household_id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Gagal memuat tugas, coba lagi ya" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login, login dulu ya" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
  }
  const household_id = body?.household_id;
  const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (judul === "") {
    return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      household_id,
      judul,
      deskripsi: typeof body?.deskripsi === "string" ? body.deskripsi : "",
      deadline: body?.deadline ?? null,
      assignee_id: body?.assignee_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal bikin tugas, coba lagi ya" }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login, login dulu ya" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan nggak jelas" }, { status: 400 });
  }
  const { id, household_id, status, assignee_id } = body ?? {};
  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json({ error: "id tugas wajib" }, { status: 400 });
  }
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const patch: any = {};
  if (status === "todo" || status === "done") patch.status = status;
  if (assignee_id === null || typeof assignee_id === "string") patch.assignee_id = assignee_id;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nggak ada yang diubah" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .eq("household_id", household_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal update tugas, coba lagi ya" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Tugas nggak ketemu" }, { status: 404 });
  return NextResponse.json(data);
}
