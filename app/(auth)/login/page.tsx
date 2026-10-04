"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth-redirect";

import { Suspense } from "react";
import { Skeleton, SkeletonLine } from "@/components/Skeleton";
import DoodleImage from "@/components/DoodleImage";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tujuanAman = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [pesan, setPesan] = useState("");

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const redirect =
      tujuanAman !== "/"
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(tujuanAman)}`
        : `${window.location.origin}/auth/callback`;
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    if (error) setPesan("Gagal kirim link masuk, coba lagi ya");
    else if (data.session) router.push(tujuanAman);
    else setPesan("Cek email kamu, link masuk udah dikirim.");
  }

  async function loginGoogle() {
    const supabase = createClient();
    const redirect =
      tujuanAman !== "/"
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(tujuanAman)}`
        : `${window.location.origin}/auth/callback`;
    // Supabase mengarahkan browser ke provider; callback yang meneruskan ke `next`.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12 text-ink">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Rumi &mdash; urusan rumah
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight">
          Masuk dulu, yuk!
        </h1>
        <span aria-hidden="true" className="mt-2 block h-1 w-12 rounded-full bg-terracotta" />
        <p className="mt-3 text-base leading-relaxed text-muted">
          Biar urusan rumah rapi bareng keluarga.
        </p>
        <DoodleImage src="/doodle/santai.svg" className="mt-6 h-32" />

        <div className="rumi-card mt-8 bg-white p-6 sm:p-8">
          {pesan && (
            <p
              role="status"
              className="mb-5 rounded-xl border-l-2 border-terracotta bg-ink/[0.04] px-4 py-3 text-base font-medium text-ink"
            >
              {pesan}
            </p>
          )}
          <form onSubmit={loginEmail} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email kamu"
                className="min-h-[44px] w-full rounded-blob-sm border-2 border-ink bg-cream px-4 py-3 text-base text-ink placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              className="rumi-transition min-h-[44px] w-full rounded-blob-sm border-2 border-ink bg-terracotta px-4 py-3 text-base font-semibold text-[#2A211C] shadow-doodle-sm hover:brightness-95 active:translate-y-px active:brightness-90"
            >
              Masuk pakai email
            </button>
          </form>

          <div aria-hidden="true" className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              atau
            </span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <button
            onClick={loginGoogle}
            className="rumi-transition min-h-[44px] w-full rounded-blob-sm border-2 border-ink bg-transparent px-4 py-3 text-base font-semibold text-ink hover:bg-ink/[0.04] active:bg-ink/[0.08]"
          >
            Masuk pakai Google
          </button>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Link masuk dikirim ke email kamu &mdash; tanpa kata sandi.
        </p>
      </div>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div
        role="status"
        aria-busy="true"
        aria-label="Memuat halaman masuk"
        className="w-full max-w-md"
      >
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <SkeletonLine w="60%" className="mt-3" />
        <div className="rumi-card mt-8 bg-white p-6 sm:p-8">
          <SkeletonLine w="30%" />
          <Skeleton className="mt-3 h-[44px] w-full rounded-blob-sm" />
          <Skeleton className="mt-4 h-[44px] w-full rounded-blob-sm" />
          <Skeleton className="mt-4 h-[44px] w-full rounded-blob-sm" />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
