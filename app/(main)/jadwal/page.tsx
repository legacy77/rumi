"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";

export default function JadwalPage({ jadwalAwal = [] }: any) {
  const ctx = useHousehold();
  const householdId = ctx?.id ?? null;
  const [jadwal, setJadwal] = useState<any[]>(jadwalAwal);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [judul, setJudul] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [lokasi, setLokasi] = useState("");

  useEffect(() => {
    if (jadwalAwal.length > 0 || !householdId) return;
    fetch(`/api/schedules?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => Array.isArray(d) && setJadwal(d))
      .catch(() => setGagalMuat(true));
  }, [jadwalAwal.length, householdId]);

  async function tambah() {
    setPesan("");
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

  return (
    <div>
      <h1>Jadwal</h1>
      <div>
        <input placeholder="Judul agenda" value={judul} onChange={(e) => setJudul(e.target.value)} />
        <input type="datetime-local" aria-label="Mulai" value={mulai} onChange={(e) => setMulai(e.target.value)} />
        <input type="datetime-local" aria-label="Selesai" value={selesai} onChange={(e) => setSelesai(e.target.value)} />
        <input placeholder="Lokasi (opsional)" value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
        <button onClick={tambah}>Tambah agenda</button>
      </div>
      {jadwal.map((j: any) => (
        <div key={j.id}>
          <p>{j.judul}</p>
          <p>
            {j.mulai}
            {j.selesai ? ` - ${j.selesai}` : ""}
            {j.lokasi ? ` · ${j.lokasi}` : ""}
          </p>
          <button onClick={() => hapus(j)}>Hapus</button>
        </div>
      ))}
      {jadwal.length === 0 && !gagalMuat && <p>Belum ada agenda, santai dulu ya</p>}
      {gagalMuat && <p>Gagal memuat jadwal, coba lagi ya</p>}
      {pesan && <p>{pesan}</p>}
    </div>
  );
}
