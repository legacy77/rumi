"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { Skeleton } from "@/components/Skeleton";
import { useHousehold } from "@/lib/household-context";

function hari(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function labelWaktu(v: string) {
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return v;
  return t.toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function JadwalPage({ jadwalAwal = [] }: any) {
  const ctx = useHousehold();
  const householdId = ctx?.id ?? null;
  const [jadwal, setJadwal] = useState<any[]>(jadwalAwal);
  const [memuat, setMemuat] = useState(jadwalAwal.length === 0 && householdId != null);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [judul, setJudul] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (jadwalAwal.length > 0 || !householdId) {
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    fetch(`/api/schedules?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => {
        if (!batal && Array.isArray(d)) setJadwal(d);
      })
      .catch(() => {
        if (!batal) setGagalMuat(true);
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [jadwalAwal.length, householdId]);

  const terurut = useMemo(
    () => [...jadwal].sort((a: any, b: any) => String(a.mulai ?? "").localeCompare(String(b.mulai ?? ""))),
    [jadwal]
  );
  const grup: Array<{ kunci: string; label: string; items: any[] }> = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const j of terurut) {
      const t = new Date(j.mulai);
      const k = Number.isNaN(t.getTime()) ? "tanpa-tanggal" : hari(t);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(j);
    }
    const hariIni = hari(new Date());
    return Array.from(map.entries()).map(([kunci, items]) => ({
      kunci,
      label: kunci === "tanpa-tanggal" ? "Tanpa tanggal" : kunci === hariIni ? "Hari ini" : kunci,
      items,
    }));
  }, [terurut]);

  async function tambah() {
    setPesan("");
    setSibuk(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          household_id: householdId,
          judul,
          mulai,
          ...(selesai ? { selesai } : {}),
          lokasi,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal bikin agenda, coba lagi ya");
        return;
      }
      setJadwal((semua) => [...semua, data]);
      setJudul("");
      setMulai("");
      setSelesai("");
      setLokasi("");
    } finally {
      setSibuk(false);
    }
  }

  async function hapus(j: any) {
    const lama = jadwal;
    setJadwal((semua) => semua.filter((x: any) => x.id !== j.id));
    try {
      const res = await fetch("/api/schedules", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: j.id, household_id: householdId }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setJadwal(lama);
      setPesan("Gagal hapus agenda, coba lagi ya");
    }
  }

  if (memuat) {
    return (
      <div className="space-y-8">
        <PageHeader title="Jadwal" description="Agenda rumah biar nggak tabrakan." />
        <div role="status" aria-label="Memuat jadwal" aria-busy="true" className="rumi-card overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rumi-row flex items-center justify-between gap-4 px-5 py-4 last:border-0">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jadwal"
        description={jadwal.length > 0 ? `${jadwal.length} agenda tercatat` : "Agenda rumah biar nggak tabrakan."}
      />

      <section aria-label="Tambah agenda" className="rumi-card rumi-card-alt bg-surface px-5 py-5 sm:px-6">
        <h2 className="text-sm font-semibold text-ink">Agenda baru</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="jadwal-judul" className="sr-only">Judul agenda</label>
            <input
              id="jadwal-judul"
              placeholder="Judul agenda"
              aria-label="Judul agenda"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="min-h-11 w-full rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink placeholder:text-muted/70"
            />
          </div>
          <div>
            <label htmlFor="jadwal-mulai" className="mb-1 block text-xs text-muted">Mulai</label>
            <input
              id="jadwal-mulai"
              type="datetime-local"
              aria-label="Mulai"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className="min-h-11 w-full rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="jadwal-selesai" className="mb-1 block text-xs text-muted">Selesai</label>
            <input
              id="jadwal-selesai"
              type="datetime-local"
              aria-label="Selesai"
              value={selesai}
              onChange={(e) => setSelesai(e.target.value)}
              className="min-h-11 w-full rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink"
            />
          </div>
          <div>
            <label htmlFor="jadwal-lokasi" className="sr-only">Lokasi</label>
            <input
              id="jadwal-lokasi"
              placeholder="Lokasi (opsional)"
              aria-label="Lokasi (opsional)"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="min-h-11 w-full rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink placeholder:text-muted/70"
            />
          </div>
          <button
            onClick={tambah}
            disabled={sibuk}
            className="rumi-transition inline-flex min-h-11 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px sm:self-end"
          >
            Tambah agenda
          </button>
        </div>
      </section>

      {grup.length > 0 && (
        <div className="space-y-7">
          {grup.map((g) => (
            <section key={g.kunci} aria-label={g.label}>
              <div className="rounded-blob-sm border-2 border-ink bg-surface px-4 pb-2 pt-2 shadow-doodle-sm flex items-baseline justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{g.label}</h2>
                <span className="text-xs tabular-nums text-muted">{g.items.length} agenda</span>
              </div>
              <ul className="rumi-card mt-3 overflow-hidden">
                {g.items.map((j: any) => (
                  <li key={j.id} className="rumi-row rumi-transition flex items-baseline justify-between gap-4 px-5 py-4 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{j.judul}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {labelWaktu(j.mulai)}
                        {j.selesai ? ` – ${labelWaktu(j.selesai)}` : ""}
                        {j.lokasi ? ` · ${j.lokasi}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => hapus(j)}
                      aria-label={`Hapus ${j.judul}`}
                      className="rumi-transition inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-blob-sm border-2 border-ink bg-white px-3 text-xs font-medium text-muted shadow-doodle-sm hover:text-terracotta"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {jadwal.length === 0 && !gagalMuat && (
        <EmptyState
          gambar="/doodle/santai.svg"
          title="Belum ada agenda, santai dulu ya"
          detail="Tambah agenda pertama di atas biar harimu rapi."
        />
      )}
      {gagalMuat && <ErrorState text="Gagal memuat jadwal, coba lagi ya" />}
      {pesan && <p role="status" className="text-sm text-terracotta">{pesan}</p>}
    </div>
  );
}
