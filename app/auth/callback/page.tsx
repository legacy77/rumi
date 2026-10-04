"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth-redirect";

// Callback tunggal untuk login (Google OAuth + magic-link email).
// - OAuth (PKCE) mengirim `?code=` → exchangeCodeForSession (verifier di localStorage browser).
// - Magic-link mengirim token di URL FRAGMENT (#access_token=...&refresh_token=...)
//   yang tidak pernah sampai ke server → dibaca di client lalu setSession.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [pesan, setPesan] = useState("");
  const sudahJalan = useRef(false);

  useEffect(() => {
    if (sudahJalan.current) return;
    sudahJalan.current = true;

    async function jalan() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const next = safeNext(params.get("next"));

      const gagal = (msg: string) => {
        setPesan(msg);
      };

      const errParam = params.get("error_description") ?? params.get("error");
      if (errParam) return gagal("Link masuk nggak valid atau udah kedaluwarsa.");

      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return gagal("Gagal masuk, coba kirim link lagi ya.");
        router.replace(next);
        return;
      }

      // Token magic-link dikirim di fragment, bukan query.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) return gagal("Gagal masuk, coba kirim link lagi ya.");
        // Bersihkan token dari URL sebelum berpindah.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(next);
        return;
      }

      // Tidak ada code/token: langsung ke tujuan (mis. user buka /auth/callback manual).
      router.replace(next);
    }

    jalan();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {pesan ? (
        <>
          <p className="text-center font-medium text-[#6C5CE7]">{pesan}</p>
          <a href="/login" className="mt-3 text-sm underline">
            Balik ke halaman masuk
          </a>
        </>
      ) : (
        <p className="text-[#786B60]">Sebentar ya, lagi masukin kamu...</p>
      )}
    </main>
  );
}
