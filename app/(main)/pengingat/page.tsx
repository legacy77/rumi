"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { toICS } from "@/lib/ics";

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

export default function PengingatPage({ awal = null }: any) {
  const ctx = useHousehold();
  const householdId = ctx?.id ?? null;
  const [tugas, setTugas] = useState<any[]>(awal?.tugas ?? []);
  const [tagihan, setTagihan] = useState<any[]>(awal?.tagihan ?? []);
  const [jadwal, setJadwal] = useState<any[]>(awal?.jadwal ?? []);
  const [gagalMuat, setGagalMuat] = useState(false);

  useEffect(() => {
    if (awal || !householdId) return;
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
        if (Array.isArray(t)) setTugas(t);
        if (Array.isArray(b)) setTagihan(b);
        if (Array.isArray(j)) setJadwal(j);
      })
      .catch(() => setGagalMuat(true));
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

  return (
    <div>
      <h1>Pengingat</h1>
      <section>
        <h2>Hari ini</h2>
        {tugasHariIni.map((t: any) => (
          <div key={`tugas-${t.id}`}>
            <p>Tugas: {t.judul}</p>
            <button onClick={() => kalenderTugas(t)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {tagihanH3.map((b: any) => (
          <div key={`tagihan-${b.id}`}>
            <p>Tagihan: {b.nama} · {b.jatuh_tempo}</p>
            <button onClick={() => kalenderTagihan(b)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {jadwalHariIni.map((j: any) => (
          <div key={`jadwal-${j.id}`}>
            <p>Agenda: {j.judul} · {j.mulai}</p>
            <button onClick={() => kalenderJadwal(j)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {!adaHariIni && !gagalMuat && <p>Nggak ada yang hari ini, santai dulu ya</p>}
      </section>
      <section>
        <h2>Terlewat</h2>
        {tugasTerlewat.map((t: any) => (
          <div key={`tugas-${t.id}`}>
            <p>Tugas: {t.judul}</p>
            <button onClick={() => kalenderTugas(t)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {tagihanTerlewat.map((b: any) => (
          <div key={`tagihan-${b.id}`}>
            <p>Tagihan: {b.nama} · {b.jatuh_tempo}</p>
            <button onClick={() => kalenderTagihan(b)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {jadwalTerlewat.map((j: any) => (
          <div key={`jadwal-${j.id}`}>
            <p>Agenda: {j.judul} · {j.mulai}</p>
            <button onClick={() => kalenderJadwal(j)}>Tambah ke Kalender HP</button>
          </div>
        ))}
        {!adaTerlewat && !gagalMuat && <p>Nggak ada yang terlewat, mantap</p>}
      </section>
      {!adaHariIni && !adaTerlewat && !gagalMuat && <p>Belum ada pengingat, santai dulu ya</p>}
      {gagalMuat && <p>Gagal memuat pengingat, coba lagi ya</p>}
    </div>
  );
}
