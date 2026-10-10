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

// "ok" | "bukan-anggota" | "db-error" — null (tanpa assignee) selalu ok.
async function cekAssignee(supabase: any, assignee_id: unknown, household_id: string) {
  if (assignee_id === null || assignee_id === undefined) return "ok";
  if (typeof assignee_id !== "string" || assignee_id.trim() === "") return "bukan-anggota";
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("user_id", assignee_id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .maybeSingle();
  if (error) return "db-error";
  if (!data) return "bukan-anggota";
  return "ok";
}

function responAssignee(hasil: string) {
  if (hasil === "bukan-anggota") {
    return NextResponse.json({ error: "Anggota nggak ketemu di rumah ini" }, { status: 400 });
  }
  return NextResponse.json({ error: "Gagal cek anggota, coba lagi ya" }, { status: 500 });
}

function validTanggal(v: unknown) {
  if (typeof v !== "string" || v.trim() === "") return false;
  const t = new Date(v).getTime();
  return !Number.isNaN(t);
}

const PRIORITAS_VALID = ["rendah", "normal", "penting"];
const PENGULANGAN_VALID = ["sekali", "harian", "mingguan", "bulanan"];

// Maju(deadline YYYY-MM-DD, interval) -> YYYY-MM-DD. Deadline null = hari ini (Asia/Jakarta).
// Bulanan di-clamp ke hari terakhir bulan tujuan (31 Jan -> 28/29 Feb, bukan 3 Mar).
function hariIniJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function majuTanggal(base: string | null, pengulangan: string) {
  const d = base && /^\d{4}-\d{2}-\d{2}$/.test(base) ? base : hariIniJakarta();
  const [y, m, dd] = d.split("-").map(Number);
  if (pengulangan === "harian") {
    const t = new Date(Date.UTC(y, m - 1, dd + 1));
    return t.toISOString().slice(0, 10);
  }
  if (pengulangan === "mingguan") {
    const t = new Date(Date.UTC(y, m - 1, dd + 7));
    return t.toISOString().slice(0, 10);
  }
  // bulanan: clamp hari ke jumlah hari bulan tujuan
  const targetMonth = m; // 0-based index bulan berikutnya
  const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(dd, lastDay);
  const t = new Date(Date.UTC(y, targetMonth, day));
  return t.toISOString().slice(0, 10);
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
    .select("id, judul, deskripsi, prioritas, status, assignee_id, deadline, pengulangan, induk_id")
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
  const pengulangan = body?.pengulangan === undefined ? "sekali" : body.pengulangan;
  if (!PENGULANGAN_VALID.includes(pengulangan)) {
    return NextResponse.json({ error: "Pengulangan nggak valid" }, { status: 400 });
  }
  if (body?.deadline !== undefined && body.deadline !== null && body.deadline !== "") {
    if (!validTanggal(body.deadline)) {
      return NextResponse.json({ error: "Deadline nggak valid" }, { status: 400 });
    }
  }
  const prioritas = body?.prioritas === undefined ? "normal" : body.prioritas;
  if (!PRIORITAS_VALID.includes(prioritas)) {
    return NextResponse.json({ error: "Prioritas nggak valid" }, { status: 400 });
  }
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const cek = await cekAssignee(supabase, body?.assignee_id, household_id);
  if (cek !== "ok") return responAssignee(cek);
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      household_id,
      judul,
      deskripsi: typeof body?.deskripsi === "string" ? body.deskripsi : "",
      deadline: body?.deadline ?? null,
      assignee_id: body?.assignee_id ?? null,
      prioritas,
      pengulangan,
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
  if ("assignee_id" in (body ?? {})) {
    const cek = await cekAssignee(supabase, assignee_id, household_id);
    if (cek !== "ok") return responAssignee(cek);
    patch.assignee_id = assignee_id ?? null;
  }
  if ("judul" in (body ?? {})) {
    const judul = typeof body.judul === "string" ? body.judul.trim() : "";
    if (judul === "") return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    patch.judul = judul;
  }
  if ("deskripsi" in (body ?? {})) {
    patch.deskripsi = typeof body.deskripsi === "string" ? body.deskripsi : "";
  }
  if ("deadline" in (body ?? {})) {
    if (body.deadline === null || body.deadline === "") {
      patch.deadline = null;
    } else {
      if (!validTanggal(body.deadline)) {
        return NextResponse.json({ error: "Deadline nggak valid" }, { status: 400 });
      }
      patch.deadline = body.deadline;
    }
  }
  if ("prioritas" in (body ?? {})) {
    if (!PRIORITAS_VALID.includes(body.prioritas)) {
      return NextResponse.json({ error: "Prioritas nggak valid" }, { status: 400 });
    }
    patch.prioritas = body.prioritas;
  }
  if ("pengulangan" in (body ?? {})) {
    if (!PENGULANGAN_VALID.includes(body.pengulangan)) {
      return NextResponse.json({ error: "Pengulangan nggak valid" }, { status: 400 });
    }
    patch.pengulangan = body.pengulangan;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nggak ada yang diubah" }, { status: 400 });
  }
  // Lazy-generate: perlu status lama + pengulangan utk bikin instance berikutnya.
  let rowLama: any = null;
  if (patch.status === "done") {
    const { data: lama, error: errLama } = await supabase
      .from("tasks")
      .select("id, household_id, judul, deskripsi, deadline, prioritas, status, assignee_id, pengulangan, induk_id")
      .eq("id", id)
      .eq("household_id", household_id)
      .single();
    if (errLama || !lama) return NextResponse.json({ error: "Tugas nggak ketemu" }, { status: 404 });
    rowLama = lama;
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
  // Anti-duplikat: cuma generate kalau status lama != done (PATCH done dipanggil ulang no-op).
  let tugasBerikut: any = null;
  if (rowLama && rowLama.status !== "done") {
    const pengulanganEfektif = patch.pengulangan ?? rowLama.pengulangan ?? "sekali";
    if (pengulanganEfektif !== "sekali") {
      const deadlineEfektif = "deadline" in patch ? patch.deadline : rowLama.deadline;
      const { data: berikut, error: errBerikut } = await supabase
        .from("tasks")
        .insert({
          household_id,
          judul: patch.judul ?? rowLama.judul,
          deskripsi: patch.deskripsi ?? rowLama.deskripsi ?? "",
          deadline: majuTanggal(deadlineEfektif, pengulanganEfektif),
          prioritas: patch.prioritas ?? rowLama.prioritas ?? "normal",
          assignee_id: null,
          pengulangan: pengulanganEfektif,
          induk_id: rowLama.induk_id ?? rowLama.id,
          created_by: user.id,
        })
        .select()
        .single();
      if (errBerikut) {
        // 23505 = duplikat (induk_id, deadline) dari race concurrent → instance sudah ada, anggap sukses.
        if ((errBerikut as any).code === "23505") {
          tugasBerikut = null;
        } else {
          return NextResponse.json(
            { error: "Tugas selesai, tapi gagal bikin ulangan berikutnya. Coba muat ulang ya" },
            { status: 500 }
          );
        }
      } else {
        tugasBerikut = berikut;
      }
    }
  }
  return NextResponse.json({ ...data, tugasBerikut });
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
  if (!id) return NextResponse.json({ error: "id tugas wajib" }, { status: 400 });
  if (!household_id) return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  const member = await activeMembership(supabase, user.id, household_id);
  if (!member) return NextResponse.json({ error: "Bukan anggota rumah ini" }, { status: 403 });
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("household_id", household_id);
  if (error) return NextResponse.json({ error: "Gagal hapus tugas, coba lagi ya" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
