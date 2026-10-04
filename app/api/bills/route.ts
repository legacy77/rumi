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

function isStorageFullMsg(msg: string) {
  return /storage|quota|full|penuh/i.test(msg ?? "");
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
    .from("bills")
    .select("id, nama, nominal, jatuh_tempo, status, bukti_url")
    .eq("household_id", household_id)
    .order("jatuh_tempo", { ascending: true });
  if (error) return NextResponse.json({ error: "Gagal memuat tagihan, coba lagi ya" }, { status: 500 });
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
    return NextResponse.json({ error: "Nama tagihan wajib diisi" }, { status: 400 });
  }
  const household_id = body?.household_id;
  const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
  const nominal = body?.nominal;
  const jatuh_tempo = body?.jatuh_tempo;
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  if (nama === "") {
    return NextResponse.json({ error: "Nama tagihan wajib diisi" }, { status: 400 });
  }
  if (typeof nominal !== "number" || Number.isNaN(nominal) || nominal < 0) {
    return NextResponse.json({ error: "Nominal harus angka ≥ 0" }, { status: 400 });
  }
  if (!validTanggal(jatuh_tempo)) {
    return NextResponse.json({ error: "Jatuh tempo nggak valid" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { data, error } = await supabase
    .from("bills")
    .insert({ household_id, nama, nominal, jatuh_tempo, created_by: user.id })
    .select()
    .single();
  if (error) {
    if (isStorageFullMsg(error.message)) {
      return NextResponse.json({ error: "Penyimpanan penuh, simpan tanpa bukti ya" }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal bikin tagihan, coba lagi ya" }, { status: 500 });
  }
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
  const { id, household_id, status, bukti_url } = body ?? {};
  if (typeof id !== "string" || id.trim() === "") {
    return NextResponse.json({ error: "id tagihan wajib" }, { status: 400 });
  }
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const patch: any = {};
  if (status === "lunas" || status === "belum") patch.status = status;
  if (typeof bukti_url === "string" && bukti_url.trim() !== "") patch.bukti_url = bukti_url;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nggak ada yang diubah" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("bills")
    .update(patch)
    .eq("id", id)
    .eq("household_id", household_id)
    .select()
    .single();
  if (error) {
    if (isStorageFullMsg(error.message)) {
      return NextResponse.json({ error: "Penyimpanan penuh, simpan tanpa bukti ya" }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal update tagihan, coba lagi ya" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Tagihan nggak ketemu" }, { status: 404 });
  return NextResponse.json(data);
}
