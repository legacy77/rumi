"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const destNext = params.get("next") ?? "";
  const [email, setEmail] = useState("");
  const [pesan, setPesan] = useState("");

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const redirect = destNext
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(destNext)}`
      : `${window.location.origin}/auth/callback`;
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    if (error) setPesan("Gagal kirim link masuk, coba lagi ya");
    else if (data.session) router.push(destNext || "/");
    else setPesan("Cek email kamu, link masuk udah dikirim.");
  }

  async function loginGoogle() {
    const supabase = createClient();
    const redirect = destNext
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(destNext)}`
      : `${window.location.origin}/auth/callback`;
    // Supabase mengarahkan browser ke provider; callback yang meneruskan ke `next`.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Masuk dulu, yuk!</h1>
      <p className="mt-2 text-[#786B60]">Biar urusan rumah rapi bareng keluarga.</p>
      {pesan && <p className="mt-3 text-[#6C5CE7] font-medium">{pesan}</p>}
      <form onSubmit={loginEmail} className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email kamu"
          className="rounded-xl border p-3"
        />
        <button type="submit" className="rounded-xl bg-[#6C5CE7] p-3 text-white">
          Masuk pakai email
        </button>
      </form>
      <button onClick={loginGoogle} className="mt-3 w-full max-w-xs rounded-xl border p-3">
        Masuk pakai Google
      </button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen flex-col items-center justify-center p-6"><p>Memuat...</p></main>}>
      <LoginContent />
    </Suspense>
  );
}
