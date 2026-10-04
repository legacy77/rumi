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

const STATUS_OK = ["perlu", "dibeli"] as const;

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
    .from("shopping_items")
    .select("id, nama, jumlah, catatan, status")
    .eq("household_id", household_id);
  if (error) return NextResponse.json({ error: "Gagal memuat belanja, coba lagi ya" }, { status: 500 });
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
    return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 });
  }
  const household_id = body?.household_id;
  const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (nama === "") {
    return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 });
  }
  if (body?.jumlah !== undefined && typeof body.jumlah !== "string") {
    return NextResponse.json({ error: "Jumlah harus teks" }, { status: 400 });
  }
  if (body?.catatan !== undefined && typeof body.catatan !== "string") {
    return NextResponse.json({ error: "Catatan harus teks" }, { status: 400 });
  }
  const status = body?.status ?? "perlu";
  if (!STATUS_OK.includes(status)) {
    return NextResponse.json({ error: "Status harus perlu atau dibeli" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      household_id,
      nama,
      jumlah: typeof body?.jumlah === "string" ? body.jumlah : "1",
      catatan: typeof body?.catatan === "string" ? body.catatan : "",
      status,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal nambah barang, coba lagi ya" }, { status: 500 });
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
  const { household_id, status } = body ?? {};
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (!STATUS_OK.includes(status)) {
    return NextResponse.json({ error: "Status harus perlu atau dibeli" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });

  // Bulk: { ids, status }
  if ("ids" in (body ?? {})) {
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((x: unknown) => typeof x === "string" && x.trim() !== "")) {
      return NextResponse.json({ error: "ids wajib diisi" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("shopping_items")
      .update({ status })
      .in("id", ids)
      .eq("household_id", household_id)
      .select();
    if (error) return NextResponse.json({ error: "Gagal update belanja, coba lagi ya" }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Single: { id, status, ... }
  const { id } = body ?? {};
  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json({ error: "id barang wajib" }, { status: 400 });
  }
  const patch: any = { status };
  if ("nama" in (body ?? {})) {
    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    if (nama === "") return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 });
    patch.nama = nama;
  }
  if ("jumlah" in (body ?? {})) {
    if (typeof body.jumlah !== "string") {
      return NextResponse.json({ error: "Jumlah harus teks" }, { status: 400 });
    }
    patch.jumlah = body.jumlah;
  }
  if ("catatan" in (body ?? {})) {
    if (typeof body.catatan !== "string") {
      return NextResponse.json({ error: "Catatan harus teks" }, { status: 400 });
    }
    patch.catatan = body.catatan;
  }
  const { data, error } = await supabase
    .from("shopping_items")
    .update(patch)
    .eq("id", id)
    .eq("household_id", household_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Gagal update belanja, coba lagi ya" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Barang nggak ketemu" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login, login dulu ya" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const qHousehold = searchParams.get("household_id");
  const dibeliSajaQ = searchParams.get("dibeli_saja");
  let body: any = null;
  if (req.method === "DELETE") {
    try {
      body = await req.json();
    } catch {
      body = null;
    }
  }
  const household_id =
    typeof body?.household_id === "string" && body.household_id.trim() !== "" ? body.household_id : qHousehold;
  if (!household_id) return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });

  const ids = body?.ids;
  const dibeliSaja = dibeliSajaQ === "true" || body?.dibeli_saja === true;
  if (Array.isArray(ids)) {
    if (ids.length === 0 || !ids.every((x: unknown) => typeof x === "string" && x.trim() !== "")) {
      return NextResponse.json({ error: "ids wajib diisi" }, { status: 400 });
    }
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .in("id", ids)
      .eq("household_id", household_id);
    if (error) return NextResponse.json({ error: "Gagal hapus belanja, coba lagi ya" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (dibeliSaja) {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("household_id", household_id)
      .eq("status", "dibeli");
    if (error) return NextResponse.json({ error: "Gagal hapus belanja, coba lagi ya" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Tentuin yang mau dihapus: ids atau dibeli_saja" }, { status: 400 });
}
