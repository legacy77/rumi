import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    return NextResponse.json({ error: "Permintaan nggak jelas" }, { status: 400 });
  }

  // Terima undangan: { code }
  if (typeof body?.code === "string") {
    const code = body.code.trim();
    if (!code) return NextResponse.json({ error: "Kode nggak ketemu, cek lagi link-nya ya" }, { status: 404 });
    const svc = serviceClient();
    const { data: invite } = await svc.from("invites").select("household_id, expires_at").eq("code", code).single();
    if (!invite) return NextResponse.json({ error: "Kode nggak ketemu, cek lagi link-nya ya" }, { status: 404 });
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Kode kedaluwarsa, minta kode baru ke admin" }, { status: 410 });
    }
    // Jangan timpa peran yang sudah ada (mis. admin): gabung hanya kalau belum jadi anggota.
    const { data: sudah } = await svc.from("memberships").select("role").eq("user_id", user.id).eq("household_id", invite.household_id).maybeSingle();
    if (!sudah) {
      const { error: gabungErr } = await svc.from("memberships").upsert(
        { user_id: user.id, household_id: invite.household_id, role: "member", status: "active" },
        { onConflict: "user_id,household_id", ignoreDuplicates: true }
      );
      if (gabungErr) return NextResponse.json({ error: "Gagal gabung, coba lagi ya" }, { status: 500 });
    }
    return NextResponse.json({ household_id: invite.household_id, message: "Udah gabung! Selamat datang di rumah barumu" });
  }

  // Bikin undangan: { household_id } (admin only)
  const household_id = body?.household_id;
  if (typeof household_id !== "string" || household_id.trim() === "") {
    return NextResponse.json({ error: "household_id wajib" }, { status: 400 });
  }
  const { data: saya } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", household_id)
    .eq("status", "active")
    .single();
  if (!saya || saya.role !== "admin") {
    return NextResponse.json({ error: "Cuma admin yang bisa bikin link undangan" }, { status: 403 });
  }
  const code = randomBytes(9).toString("base64url");
  const expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { error: insErr } = await supabase.from("invites").insert({
    household_id,
    code,
    expires_at,
    created_by: user.id,
  });
  if (insErr) return NextResponse.json({ error: "Gagal bikin undangan, coba lagi ya" }, { status: 500 });
  return NextResponse.json({ code, url: `/join?code=${code}` });
}
