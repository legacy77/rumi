"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    await supabase.auth.signInWithOtp({ email });
  }

  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold">Masuk dulu, yuk!</h1>
      <p className="mt-2 text-[#786B60]">Biar urusan rumah rapi bareng keluarga.</p>
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
