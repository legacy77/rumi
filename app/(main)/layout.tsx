"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
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
    (async () => {
      setGagal(false);
      try {
        let resMe, resHs;
        [resMe, resHs] = await Promise.all([fetch("/api/me"), fetch("/api/households")]);
        // cookie may not be synced yet (SSR sync or fresh login): retry once
        if ((resMe.status === 401 || resHs.status === 401) && !retryUsed && !batal) {
          retryUsed = true;
          await new Promise((r) => setTimeout(r, 300));
          [resMe, resHs] = await Promise.all([fetch("/api/me"), fetch("/api/households")]);
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
      <div>
        <p>Gagal memuat rumahmu, coba lagi ya</p>
        <button onClick={() => setUlangi((n) => n + 1)}>Coba lagi</button>
      </div>
    );
  }
  if (aktif === undefined) return <p>Siapin rumahmu dulu ya…</p>;
  return (
    <HouseholdProvider initial={aktif ? { ...aktif, userId } : null}>
      {children}
      <BottomNav />
    </HouseholdProvider>
  );
}
