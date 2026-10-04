"use client";
import { useEffect, useState } from "react";
import AttentionCard from "@/components/AttentionCard";
import BottomNav from "@/components/BottomNav";
import { useHousehold } from "@/lib/household-context";
import { createClient } from "@/lib/supabase/client";

function tanggalLokal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tanggalDari(v: unknown): string | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return null;
  return tanggalLokal(t);
}

export default function Dashboard({ urgent = null, counts = null }: any) {
  const ctx = useHousehold();
  const householdId = ctx?.id ?? null;
  const [tugas, setTugas] = useState<any[]>([]);
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [belanja, setBelanja] = useState<any[]>([]);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [gagalMuat, setGagalMuat] = useState(false);

  useEffect(() => {
    if (!householdId) {
      setTugas([]);
      setTagihan([]);
      setBelanja([]);
      setJadwal([]);
      return;
    }
    let batal = false;
    let channel: any = null;
    async function muat() {
      try {
        const [t, b, s, j] = await Promise.all([
          fetch(`/api/tasks?household_id=${householdId}`).then((r) => {
            if (!r.ok) throw new Error("gagal");
            return r.json();
          }),
          fetch(`/api/bills?household_id=${householdId}`).then((r) => {
            if (!r.ok) throw new Error("gagal");
            return r.json();
          }),
          fetch(`/api/shopping?household_id=${householdId}`).then((r) => {
            if (!r.ok) throw new Error("gagal");
            return r.json();
          }),
          fetch(`/api/schedules?household_id=${householdId}`).then((r) => {
            if (!r.ok) throw new Error("gagal");
            return r.json();
          }),
        ]);
        if (batal) return;
        if (Array.isArray(t)) setTugas(t);
        if (Array.isArray(b)) setTagihan(b);
        if (Array.isArray(s)) setBelanja(s);
        if (Array.isArray(j)) setJadwal(j);
      } catch {
        if (!batal) setGagalMuat(true);
      }
    }
    muat();
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`household:${householdId}`)
        .on("postgres_changes", { event: "*", schema: "public" }, () => {
          if (!batal) muat();
        })
        .subscribe();
    } catch {
      // Realtime live-verify ditunda; fetch di atas sudah cukup.
    }
    return () => {
      batal = true;
      if (channel) {
        try {
          channel.unsubscribe();
        } catch {
          // Abaikan — channel mungkin belum tersambung.
        }
      }
      setTugas([]);
      setTagihan([]);
      setBelanja([]);
      setJadwal([]);
    };
  }, [householdId]);

  const hariIni = tanggalLokal(new Date());
  const tigaHariLagi = tanggalLokal(new Date(Date.now() + 3 * 24 * 3600 * 1000));

  const tugasHariIni = tugas.filter((t: any) => t.status !== "done" && tanggalDari(t.deadline) === hariIni);
  const tagihanH3 = tagihan.filter((b: any) => {
    if (b.status === "lunas") return false;
    const d = tanggalDari(b.jatuh_tempo);
    return d !== null && d <= tigaHariLagi;
  });
  const belanjaPerlu = belanja.filter((x: any) => x.status !== "dibeli");
  const agendaHariIni = jadwal.filter((j: any) => tanggalDari(j.mulai) === hariIni);

  const hitung = {
    tugas: tugasHariIni.length,
    tagihan: tagihanH3.length,
    belanja: belanjaPerlu.length,
    jadwal: agendaHariIni.length,
  };
  const angka = (k: keyof typeof hitung) => counts?.[k] ?? hitung[k] ?? 0;

  const tagihanTop = [...tagihanH3].sort((a: any, b: any) =>
    String(a.jatuh_tempo ?? "").localeCompare(String(b.jatuh_tempo ?? ""))
  )[0];
  const otomatis = tagihanTop
    ? { text: `${tagihanTop.nama} jatuh tempo ${tagihanTop.jatuh_tempo}` }
    : tugasHariIni[0]
      ? { text: `${tugasHariIni[0].judul} tenggat hari ini` }
      : agendaHariIni[0]
        ? { text: `${agendaHariIni[0].judul} agenda hari ini` }
        : belanjaPerlu.length > 0
          ? { text: `${belanjaPerlu.length} barang belum dibeli` }
          : null;

  const hero = urgent ?? otomatis;
  const total = angka("tugas") + angka("tagihan") + angka("belanja") + angka("jadwal");
  const sisa = hero && total > 1 ? `+ ${total - 1} hal lain nunggu` : null;

  return (
    <div>
      <h1>Beranda</h1>
      {hero ? (
        <AttentionCard text={hero.text} sisa={sisa} />
      ) : (
        !gagalMuat && <p>Santai dulu, nggak ada yang urgent</p>
      )}
      <section>
        <a href="/tugas">
          <h2>Tugas tersisa hari ini</h2>
          <p>{angka("tugas")} tugas</p>
        </a>
        <a href="/tagihan">
          <h2>Tagihan H-3</h2>
          <p>{angka("tagihan")} tagihan</p>
        </a>
        <a href="/belanja">
          <h2>Belanja belum dibeli</h2>
          <p>{angka("belanja")} barang</p>
        </a>
        <a href="/jadwal">
          <h2>Agenda hari ini</h2>
          <p>{angka("jadwal")} agenda</p>
        </a>
      </section>
      {gagalMuat && <p>Gagal memuat ringkasan, coba lagi ya</p>}
      <BottomNav />
    </div>
  );
}
