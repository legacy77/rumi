"use client";
import { useEffect, useState } from "react";
import AttentionCard from "@/components/AttentionCard";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { Skeleton } from "@/components/Skeleton";
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
  const [memuat, setMemuat] = useState<boolean>(Boolean(householdId));
  const [daftar, setDaftar] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [buatGagal, setBuatGagal] = useState<string | null>(null);
  const [buatSibuk, setBuatSibuk] = useState(false);

  useEffect(() => {
    if (!householdId) {
      setTugas([]);
      setTagihan([]);
      setBelanja([]);
      setJadwal([]);
      setMemuat(false);
      return;
    }
    let batal = false;
    let channel: any = null;
    setMemuat(true);
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
      } finally {
        if (!batal) setMemuat(false);
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

  // Daftar rumah ikut dimuat ulang tiap householdId berubah (mis. habis bikin rumah baru).
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const r = await fetch("/api/households");
        const d = r.ok ? await r.json() : [];
        if (batal || !Array.isArray(d)) return;
        setDaftar(
          d
            .map((m: any) => ({ id: m?.households?.id, nama: m?.households?.nama, role: m?.role }))
            .filter((h: any) => h.id)
        );
      } catch {
        // Abaikan — daftar rumah bukan data kritis dasbor.
      }
    })();
    return () => {
      batal = true;
    };
  }, [householdId]);

  async function buatRumah() {
    const v = nama.trim();
    if (!v) {
      setBuatGagal("Nama rumah wajib diisi");
      return;
    }
    setBuatSibuk(true);
    setBuatGagal(null);
    try {
      const r = await fetch("/api/households", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nama: v }),
      });
      if (!r.ok) throw new Error("gagal");
      const rumah = await r.json();
      setNama("");
      ctx?.switchHousehold?.({ id: rumah.id, nama: rumah.nama, role: "admin" });
    } catch {
      setBuatGagal("Gagal buat rumah, coba lagi ya");
    } finally {
      setBuatSibuk(false);
    }
  }

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

  const ringkas = [
    { href: "/tugas", judul: "Tugas tersisa hari ini", nilai: angka("tugas"), satuan: "tugas" },
    { href: "/tagihan", judul: "Tagihan H-3", nilai: angka("tagihan"), satuan: "tagihan" },
    { href: "/belanja", judul: "Belanja belum dibeli", nilai: angka("belanja"), satuan: "barang" },
    { href: "/jadwal", judul: "Agenda hari ini", nilai: angka("jadwal"), satuan: "agenda" },
  ];

  if (memuat && !gagalMuat) {
    return (
      <div className="space-y-8">
        <PageHeader title="Beranda" description="Ringkasan rumahmu hari ini." />
        <div role="status" aria-label="Memuat ringkasan" aria-busy="true" className="space-y-8">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="space-y-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center justify-between border-b border-hairline py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Beranda"
        description="Ringkasan rumahmu hari ini."
        action={
          daftar.length >= 1 ? (
            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="sr-only">Pindah rumah</span>
              <select
                aria-label="Pindah rumah"
                value={householdId ?? ""}
                onChange={(e) => {
                  const pilih = daftar.find((h: any) => h.id === e.target.value);
                  if (pilih) ctx?.switchHousehold?.(pilih);
                }}
                className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm text-ink"
              >
                {!householdId && <option value="">Pilih rumah</option>}
                {daftar.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.nama}
                  </option>
                ))}
              </select>
            </label>
          ) : undefined
        }
      />

      {!householdId && !gagalMuat && (
        <section className="rounded-2xl border border-line bg-surface px-5 py-6 sm:px-6">
          <h2 className="text-base font-semibold text-ink">Belum ada rumah aktif, bikin rumah pertamamu dulu ya</h2>
          <p className="mt-1 text-sm text-muted">Kasih nama biar urusan rumah bisa mulai dirapikan.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="Nama rumah"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama rumah, mis. Rumah Tebet"
              className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/70"
            />
            <button
              onClick={buatRumah}
              disabled={buatSibuk}
              className="rumi-transition inline-flex min-h-11 items-center justify-center rounded-xl bg-terracotta px-5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98]"
            >
              Buat rumah
            </button>
          </div>
          {buatGagal && <p className="mt-3 text-sm text-terracotta">{buatGagal}</p>}
        </section>
      )}

      {hero ? (
        <AttentionCard text={hero.text} sisa={sisa} />
      ) : (
        !gagalMuat && (
          <EmptyState title="Santai dulu, nggak ada yang urgent" detail="Semua urusan rumah kelihatan aman hari ini." />
        )
      )}

      <section aria-label="Ringkasan per area">
        <ul className="divide-y divide-hairline border-y border-line">
          {ringkas.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                className="rumi-transition flex min-h-14 items-baseline justify-between gap-4 py-4 hover:opacity-80"
              >
                <span className="text-sm font-medium text-ink">{r.judul}</span>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  <span className="font-semibold text-ink">{r.nilai}</span> {r.satuan}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="/pengingat" className="rumi-transition text-muted hover:text-ink">
            Pengingat hari ini →
          </a>
          <a href="/keluarga" className="rumi-transition text-muted hover:text-ink">
            Anggota keluarga →
          </a>
        </div>
      </section>

      {gagalMuat && <ErrorState text="Gagal memuat ringkasan, coba lagi ya" />}
    </div>
  );
}
