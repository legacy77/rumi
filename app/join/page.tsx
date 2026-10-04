"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton, SkeletonLine } from "@/components/Skeleton";

type Tahap = "memuat" | "sukses" | "kedaluwarsa" | "perluLogin" | "gagal";

function Gabung() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const [pesan, setPesan] = useState("Lagi ngecek kode undangan...");
  const [tahap, setTahap] = useState<Tahap>("memuat");
  const router = useRouter();
  const loginHref = `/login?next=${encodeURIComponent('/join?code=' + code)}`;
  useEffect(() => {
    if (!code) {
      setPesan("Kode undangan nggak ada. Minta link undangan ke admin keluargamu ya.");
      setTahap("gagal");
      return;
    }
    fetch("/api/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setPesan(data.message ?? "Udah gabung! Selamat datang di rumah barumu");
          setTahap("sukses");
        } else if (res.status === 410) {
          setPesan("Kode kedaluwarsa, minta kode baru ke admin");
          setTahap("kedaluwarsa");
        } else if (res.status === 401) {
          setPesan("Belum login, login dulu ya");
          setTahap("perluLogin");
          router.push(loginHref);
        } else {
          setPesan(data.error ?? "Kode nggak ketemu, cek lagi link-nya ya");
          setTahap("gagal");
        }
      })
      .catch(() => {
        setPesan("Jaringan bermasalah, coba lagi ya");
        setTahap("gagal");
      });
  }, [code]);

  const badge =
    tahap === "sukses"
      ? { label: "Berhasil", tone: "text-terracotta" }
      : tahap === "memuat"
        ? { label: "Memeriksa", tone: "text-muted" }
        : tahap === "kedaluwarsa"
          ? { label: "Kedaluwarsa", tone: "text-terracotta" }
          : tahap === "perluLogin"
            ? { label: "Perlu masuk", tone: "text-terracotta" }
            : { label: "Undangan", tone: "text-muted" };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12 text-ink">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Undangan keluarga
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight">
          Gabung Keluarga
        </h1>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-quiet sm:p-8">
          <div className="flex items-center gap-3">
            {tahap === "memuat" ? (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted animate-pulse"
              />
            ) : (
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  tahap === "sukses" ? "bg-terracotta" : "bg-muted"
                }`}
              />
            )}
            <span className={`text-xs font-bold uppercase tracking-[0.18em] ${badge.tone}`}>
              {badge.label}
            </span>
          </div>

          <p
            role="status"
            aria-live="polite"
            className="mt-4 text-lg font-medium leading-relaxed text-ink"
          >
            {pesan}
          </p>

          {tahap === "perluLogin" && (
            <a
              href={loginHref}
              className="rumi-transition mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-terracotta px-4 py-3 text-base font-semibold text-[#2A211C] hover:brightness-95 active:brightness-90"
            >
              Login dulu
            </a>
          )}

          {tahap === "sukses" && (
            <a
              href="/"
              className="rumi-transition mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-terracotta px-4 py-3 text-base font-semibold text-[#2A211C] hover:brightness-95 active:brightness-90"
            >
              Ke Beranda
            </a>
          )}

          {tahap === "gagal" && (
            <a
              href="/"
              className="rumi-transition mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-line px-4 py-3 text-base font-semibold text-ink hover:bg-ink/[0.04] active:bg-ink/[0.08]"
            >
              Kembali ke Beranda
            </a>
          )}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Kode undangan dikirim admin keluargamu lewat link pribadi.
        </p>
      </div>
    </main>
  );
}

function JoinSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div
        role="status"
        aria-busy="true"
        aria-label="Memeriksa kode undangan"
        className="w-full max-w-md"
      >
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-2.5 w-2.5" style={{ borderRadius: "9999px" }} />
            <SkeletonLine w="28%" />
          </div>
          <SkeletonLine w="85%" className="mt-5" />
          <Skeleton className="mt-6 h-[44px] w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinSkeleton />}>
      <Gabung />
    </Suspense>
  );
}
