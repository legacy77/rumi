"use client";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { HouseholdProvider } from "@/lib/household-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [aktif, setAktif] = useState<any>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);
  const [ulangi, setUlangi] = useState(0);

  useEffect(() => {
    let batal = false;
    (async () => {
      setGagal(false);
      try {
        const [saya, baris] = await Promise.all([
          fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/households").then((r) => {
            if (!r.ok) throw new Error("gagal");
            return r.json();
          }),
        ]);
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
  }, [ulangi]);

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
