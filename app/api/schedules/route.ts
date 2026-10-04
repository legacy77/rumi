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

function validTanggal(v: unknown) {
  if (typeof v !== "string" || v.trim() === "") return false;
  const t = new Date(v).getTime();
  return !Number.isNaN(t);
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
    .from("schedules")
    .select("id, judul, mulai, selesai, lokasi")
    .eq("household_id", household_id)
    .order("mulai", { ascending: true });
  if (error) return NextResponse.json({ error: "Gagal memuat jadwal, coba lagi ya" }, { status: 500 });
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
    return NextResponse.json({ error: "Judul agenda wajib diisi" }, { status: 400 });
  }
  const household_id = body?.household_id;
  const judul = typeof body?.judul === "string" ? body.judul.trim() : "";
  const mulai = body?.mulai;
  const selesai = body?.selesai;
  const lokasi = typeof body?.lokasi === "string" ? body.lokasi.trim() : "";
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (judul === "") {
    return NextResponse.json({ error: "Judul agenda wajib diisi" }, { status: 400 });
  }
  if (!validTanggal(mulai)) {
    return NextResponse.json({ error: "Waktu mulai nggak valid" }, { status: 400 });
  }
  if (selesai !== undefined && selesai !== null && selesai !== "" && !validTanggal(selesai)) {
    return NextResponse.json({ error: "Waktu selesai nggak valid" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      household_id,
      judul,
      mulai,
      selesai: selesai ?? null,
      lokasi,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal bikin agenda, coba lagi ya" }, { status: 500 });
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
  const { id, household_id } = body ?? {};
  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json({ error: "id agenda wajib" }, { status: 400 });
  }
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const patch: any = {};
  if ("judul" in (body ?? {})) {
    const judul = typeof body.judul === "string" ? body.judul.trim() : "";
    if (judul === "") return NextResponse.json({ error: "Judul agenda wajib diisi" }, { status: 400 });
    patch.judul = judul;
  }
  if ("mulai" in (body ?? {})) {
    if (!validTanggal(body.mulai)) {
      return NextResponse.json({ error: "Waktu mulai nggak valid" }, { status: 400 });
    }
    patch.mulai = body.mulai;
  }
  if ("selesai" in (body ?? {})) {
    if (body.selesai !== null && body.selesai !== "" && !validTanggal(body.selesai)) {
      return NextResponse.json({ error: "Waktu selesai nggak valid" }, { status: 400 });
    }
    patch.selesai = body.selesai === "" ? null : body.selesai;
  }
  if ("lokasi" in (body ?? {})) {
    if (typeof body.lokasi !== "string") {
      return NextResponse.json({ error: "Lokasi harus teks" }, { status: 400 });
    }
    patch.lokasi = body.lokasi.trim();
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nggak ada yang diubah" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("schedules")
    .update(patch)
    .eq("id", id)
    .eq("household_id", household_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal update agenda, coba lagi ya" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Agenda nggak ketemu" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login, login dulu ya" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const id = typeof body?.id === "string" && body.id.trim() !== "" ? body.id : searchParams.get("id");
  const household_id =
    typeof body?.household_id === "string" && body.household_id.trim() !== ""
      ? body.household_id
      : searchParams.get("household_id");
  if (!id) return NextResponse.json({ error: "id agenda wajib" }, { status: 400 });
  if (!household_id) return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { error } = await supabase.from("schedules").delete().eq("id", id).eq("household_id", household_id);
  if (error) return NextResponse.json({ error: "Gagal hapus agenda, coba lagi ya" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
