"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { toICS } from "@/lib/ics";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { Skeleton } from "@/components/Skeleton";

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

function unduhICS(namaFile: string, isi: string) {
  const blob = new Blob([isi], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile.endsWith(".ics") ? namaFile : `${namaFile}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function waktuKalender(tanggal: string) {
  return { mulai: `${tanggal}T09:00:00`, selesai: `${tanggal}T10:00:00` };
}

function TombolKalender({ onKlik }: { onKlik: () => void }) {
  return (
    <button
      type="button"
      onClick={onKlik}
      className="rumi-transition inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-terracotta hover:opacity-80"
    >
      Tambah ke Kalender HP
    </button>
  );
}

export default function PengingatPage({ awal = null }: any) {
  const ctx = useHousehold();
  const householdId = ctx?.id ?? null;
  const [tugas, setTugas] = useState<any[]>(awal?.tugas ?? []);
  const [tagihan, setTagihan] = useState<any[]>(awal?.tagihan ?? []);
  const [jadwal, setJadwal] = useState<any[]>(awal?.jadwal ?? []);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [memuat, setMemuat] = useState(!awal);

  useEffect(() => {
    if (awal) {
      // `awal` adalah benih SSR. Kalau prop datang belakangan (identity baru),
      // sinkronkan datanya — jangan biarkan state kosong memalsukan empty state.
      setTugas(Array.isArray(awal.tugas) ? awal.tugas : []);
      setTagihan(Array.isArray(awal.tagihan) ? awal.tagihan : []);
      setJadwal(Array.isArray(awal.jadwal) ? awal.jadwal : []);
      setMemuat(false);
      return;
    }
    if (!householdId) {
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    setGagalMuat(false);
    Promise.all([
      fetch(`/api/tasks?household_id=${householdId}`).then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      }),
      fetch(`/api/bills?household_id=${householdId}`).then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      }),
      fetch(`/api/schedules?household_id=${householdId}`).then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      }),
    ])
      .then(([t, b, j]) => {
        if (batal) return;
        if (Array.isArray(t)) setTugas(t);
        if (Array.isArray(b)) setTagihan(b);
        if (Array.isArray(j)) setJadwal(j);
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
  }, [awal, householdId]);

  const hariIni = tanggalLokal(new Date());
  const tigaHariLagi = tanggalLokal(new Date(Date.now() + 3 * 24 * 3600 * 1000));

  const tugasHariIni = tugas.filter((t: any) => t.status !== "done" && tanggalDari(t.deadline) === hariIni);
  const tagihanH3 = tagihan.filter((b: any) => {
    if (b.status === "lunas") return false;
    const t = tanggalDari(b.jatuh_tempo);
    return t !== null && t >= hariIni && t <= tigaHariLagi;
  });
  const jadwalHariIni = jadwal.filter((j: any) => tanggalDari(j.mulai) === hariIni);

  const tugasTerlewat = tugas.filter((t: any) => {
    if (t.status === "done") return false;
    const d = tanggalDari(t.deadline);
    return d !== null && d < hariIni;
  });
  const tagihanTerlewat = tagihan.filter((b: any) => {
    if (b.status === "lunas") return false;
    const d = tanggalDari(b.jatuh_tempo);
    return d !== null && d < hariIni;
  });
  const jadwalTerlewat = jadwal.filter((j: any) => {
    const d = tanggalDari(j.mulai);
    return d !== null && d < hariIni;
  });

  const adaHariIni = tugasHariIni.length + tagihanH3.length + jadwalHariIni.length > 0;
  const adaTerlewat = tugasTerlewat.length + tagihanTerlewat.length + jadwalTerlewat.length > 0;
  const kosongSemua = !adaHariIni && !adaTerlewat;
  const hitungHariIni = tugasHariIni.length + tagihanH3.length + jadwalHariIni.length;
  const hitungTerlewat = tugasTerlewat.length + tagihanTerlewat.length + jadwalTerlewat.length;

  function kalenderTugas(t: any) {
    const d = tanggalDari(t.deadline) ?? hariIni;
    const w = waktuKalender(d);
    unduhICS(t.judul, toICS({ judul: t.judul, mulai: w.mulai, selesai: w.selesai }));
  }

  function kalenderTagihan(b: any) {
    const d = tanggalDari(b.jatuh_tempo) ?? hariIni;
    const w = waktuKalender(d);
    unduhICS(b.nama, toICS({ judul: `Bayar ${b.nama}`, mulai: w.mulai, selesai: w.selesai }));
  }

  function kalenderJadwal(j: any) {
    const mulai = typeof j.mulai === "string" ? j.mulai : hariIni;
    const selesai = typeof j.selesai === "string" && j.selesai.trim() !== "" ? j.selesai : mulai;
    unduhICS(j.judul, toICS({ judul: j.judul, mulai, selesai }));
  }

  if (memuat && !gagalMuat) {
    return (
      <div className="space-y-8">
        <PageHeader title="Pengingat" description="Yang jatuh tempo hari ini dan yang kelewat." />
        <div role="status" aria-label="Memuat pengingat" aria-busy="true" className="space-y-10">
          {[0, 1].map((s) => (
            <div key={s}>
              <div className="flex items-baseline justify-between border-b border-line pb-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="divide-y divide-hairline">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Pengingat" description="Yang jatuh tempo hari ini dan yang kelewat." />

      {kosongSemua && !gagalMuat ? (
        <EmptyState
          title="Belum ada pengingat, santai dulu ya"
          detail="Tugas, tagihan, dan agenda yang mendesak bakal muncul di sini."
        />
      ) : (
        <>
          <section aria-label="Hari ini">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 className="text-base font-semibold tracking-tight text-ink">Hari ini</h2>
              <span className="text-xs tabular-nums text-muted">{hitungHariIni} pengingat</span>
            </div>
            <ul className="divide-y divide-hairline">
              {tugasHariIni.map((t: any) => (
                <li key={`tugas-${t.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">Tugas: {t.judul}</p>
                  <TombolKalender onKlik={() => kalenderTugas(t)} />
                </li>
              ))}
              {tagihanH3.map((b: any) => (
                <li key={`tagihan-${b.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">
                    Tagihan: {b.nama} · <span className="text-muted">{b.jatuh_tempo}</span>
                  </p>
                  <TombolKalender onKlik={() => kalenderTagihan(b)} />
                </li>
              ))}
              {jadwalHariIni.map((j: any) => (
                <li key={`jadwal-${j.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">
                    Agenda: {j.judul} · <span className="text-muted">{j.mulai}</span>
                  </p>
                  <TombolKalender onKlik={() => kalenderJadwal(j)} />
                </li>
              ))}
            </ul>
            {!adaHariIni && !gagalMuat && (
              <p className="py-4 text-sm text-muted">Nggak ada yang hari ini, santai dulu ya</p>
            )}
          </section>

          <section aria-label="Terlewat">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink">
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-terracotta" />
                Terlewat
              </h2>
              <span className="text-xs tabular-nums text-muted">{hitungTerlewat} pengingat</span>
            </div>
            <ul className="divide-y divide-hairline">
              {tugasTerlewat.map((t: any) => (
                <li key={`tugas-${t.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">Tugas: {t.judul}</p>
                  <TombolKalender onKlik={() => kalenderTugas(t)} />
                </li>
              ))}
              {tagihanTerlewat.map((b: any) => (
                <li key={`tagihan-${b.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">
                    Tagihan: {b.nama} · <span className="text-muted">{b.jatuh_tempo}</span>
                  </p>
                  <TombolKalender onKlik={() => kalenderTagihan(b)} />
                </li>
              ))}
              {jadwalTerlewat.map((j: any) => (
                <li key={`jadwal-${j.id}`} className="flex items-center justify-between gap-4 py-2">
                  <p className="min-w-0 flex-1 py-2 text-sm text-ink">
                    Agenda: {j.judul} · <span className="text-muted">{j.mulai}</span>
                  </p>
                  <TombolKalender onKlik={() => kalenderJadwal(j)} />
                </li>
              ))}
            </ul>
            {!adaTerlewat && !gagalMuat && (
              <p className="py-4 text-sm text-muted">Nggak ada yang terlewat, mantap</p>
            )}
          </section>
        </>
      )}

      {gagalMuat && <ErrorState text="Gagal memuat pengingat, coba lagi ya" />}
    </div>
  );
}
