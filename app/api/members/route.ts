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
