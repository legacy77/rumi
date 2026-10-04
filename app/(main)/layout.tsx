"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import { HouseholdProvider } from "@/lib/household-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [aktif, setAktif] = useState<any>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);
  const [ulangi, setUlangi] = useState(0);

  useEffect(() => {
    let batal = false;
    let retryUsed = false;
    const ac = new AbortController();
    // Jaring pengaman: koneksi menggantung tak boleh membuat layar
    // "Menyiapkan rumah" macet selamanya — alihkan ke state gagal + Coba lagi.
    const jedaWaktu = setTimeout(() => ac.abort(), 8000);
    const ambil = () =>
      Promise.all([
        fetch("/api/me", { signal: ac.signal }),
        fetch("/api/households", { signal: ac.signal }),
      ]);
    (async () => {
      setGagal(false);
      try {
        let resMe, resHs;
        [resMe, resHs] = await ambil();
        // cookie may not be synced yet (SSR sync or fresh login): retry once
        if ((resMe.status === 401 || resHs.status === 401) && !retryUsed && !batal) {
          retryUsed = true;
          await new Promise((r) => setTimeout(r, 300));
          [resMe, resHs] = await ambil();
        }
        if (resMe.status === 401 || resHs.status === 401) {
          if (!batal) router.replace("/login");
          return;
        }
        if (!resHs.ok) throw new Error("gagal");
        const [saya, baris] = await Promise.all([resMe.ok ? resMe.json() : null, resHs.json()]);
        if (batal) return;
        const daftar = (Array.isArray(baris) ? baris : [])
          .map((m: any) => ({ id: m?.households?.id, nama: m?.households?.nama, role: m?.role }))
          .filter((h: any) => h.id);
        setUserId(saya?.id ?? null);
        setAktif(daftar[0] ?? null);
      } catch {
        if (!batal) setGagal(true);
      }
    })();
    return () => {
      batal = true;
      clearTimeout(jedaWaktu);
      ac.abort();
    };
  }, [ulangi, router]);

  // refetch after navigation (login redirect, household switch) so fresh session is picked up
  useEffect(() => {
    const onRouteChange = () => {
      setGagal(false);
      setUlangi((n) => n + 1);
    };
    const events = (router as any)?.events;
    events?.on?.("routeChangeComplete", onRouteChange);
    return () => events?.off?.("routeChangeComplete", onRouteChange);
  }, [router]);

  if (gagal) {
    return (
      <main className="min-h-screen bg-cream px-5 py-16 sm:px-8">
        <div className="rumi-card mx-auto max-w-md p-6 text-center">
          <div
            className="mx-auto flex h-14 w-14 -rotate-3 items-center justify-center rounded-full border-2 border-ink bg-terracotta/15 text-2xl"
            aria-hidden="true"
          >
            ⌂
          </div>
          <h1 className="mt-4 text-lg font-semibold text-ink">Gagal memuat rumahmu, coba lagi ya</h1>
          <p className="mt-1 text-sm text-muted">Koneksi lagi ngambek. Santai, coba sekali lagi.</p>
          <button
            onClick={() => setUlangi((n) => n + 1)}
            className="rumi-transition mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px sm:w-auto"
          >
            Coba lagi
          </button>
        </div>
      </main>
    );
  }
  if (aktif === undefined) {
    return (
      <main className="min-h-screen bg-cream px-5 py-10 sm:px-8" role="status" aria-label="Menyiapkan rumah">
        <div className="mx-auto max-w-4xl animate-pulse space-y-8">
          <header className="flex items-center gap-3 border-b-2 border-ink pb-6">
            <div className="h-10 w-10 rounded-blob-sm bg-terracotta/20" />
            <div className="space-y-2">
              <div className="h-3 w-14 rounded bg-ink/10" />
              <div className="h-5 w-40 rounded bg-ink/10" />
            </div>
          </header>
          <div className="max-w-2xl space-y-4">
            <div className="h-9 w-52 rounded-blob-sm bg-ink/10" />
            <div className="h-4 w-72 max-w-full rounded bg-ink/[0.07]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-blob border-2 border-ink/15 bg-surface p-5">
                <div className="h-3 w-20 rounded bg-ink/[0.08]" />
                <div className="mt-5 h-7 w-12 rounded bg-ink/[0.08]" />
                <div className="mt-3 h-3 w-32 rounded bg-ink/[0.06]" />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">Menyiapkan rumahmu…</p>
        </div>
      </main>
    );
  }
  return (
    <HouseholdProvider initial={aktif ? { ...aktif, userId } : null}>
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-5xl gap-10 px-4 pb-28 pt-6 sm:px-6 lg:pb-16 lg:pt-10">
          <DesktopNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <BottomNav />
    </HouseholdProvider>
  );
}
