"use client";
import { useEffect, useState } from "react";
import BillCard from "@/components/BillCard";
import { useHousehold } from "@/lib/household-context";

const BATAS_BUKTI = 1024 * 1024;

function dalamH3(jatuh_tempo: string) {
  const kini = new Date();
  kini.setHours(0, 0, 0, 0);
  const tempo = new Date(jatuh_tempo);
  if (Number.isNaN(tempo.getTime())) return false;
  const selisih = Math.ceil((tempo.getTime() - kini.getTime()) / (24 * 3600 * 1000));
  return selisih <= 3;
}

export default function TagihanPage({ tagihanAwal = [] }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const householdId = ctx?.id ?? null;
  const [tagihan, setTagihan] = useState<any[]>(tagihanAwal);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");

  useEffect(() => {
    if (tagihanAwal.length > 0 || !householdId) return;
    fetch(`/api/bills?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => Array.isArray(d) && setTagihan(d))
      .catch(() => setGagalMuat(true));
  }, [tagihanAwal.length, householdId]);

  const mendesak = tagihan.filter((b: any) => b.status !== "lunas" && dalamH3(b.jatuh_tempo));
  const sisanya = tagihan.filter((b: any) => !(b.status !== "lunas" && dalamH3(b.jatuh_tempo)));

  async function bayar(b: any, bukti_url?: string) {
    const lama = b.status;
    setTagihan((semua) => semua.map((x: any) => (x.id === b.id ? { ...x, status: "lunas" } : x)));
    try {
      const res = await fetch("/api/bills", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: b.id, household_id: householdId, status: "lunas", ...(bukti_url ? { bukti_url } : {}) }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setTagihan((semua) => semua.map((x: any) => (x.id === b.id ? { ...x, status: lama } : x)));
      setPesan("Gagal tandai lunas, coba lagi ya");
    }
  }

  function pilihBukti(e: any, b: any) {
    const file = e.target?.files?.[0];
    if (!file) {
      bayar(b);
      return;
    }
    if (file.size > BATAS_BUKTI) {
      setPesan("Penyimpanan penuh, simpan tanpa bukti ya");
      bayar(b);
      return;
    }
    bayar(b);
  }

  async function tambah() {
    setPesan("");
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ household_id: householdId, nama, nominal: Number(nominal), jatuh_tempo: jatuhTempo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPesan(data.error ?? "Gagal bikin tagihan, coba lagi ya");
      return;
    }
    setTagihan((semua) => [...semua, data]);
    setNama("");
    setNominal("");
    setJatuhTempo("");
  }

  return (
    <div>
      <h1>Tagihan</h1>
      <div>
        <input placeholder="Nama tagihan" value={nama} onChange={(e) => setNama(e.target.value)} />
        <input placeholder="Nominal" inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value)} />
        <input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} />
        <button onClick={tambah}>Tambah tagihan</button>
      </div>
      {mendesak.length > 0 && (
        <section>
          <h2>Jatuh tempo ≤ H-3</h2>
          {mendesak.map((b: any) => (
            <div key={b.id}>
              <BillCard nama={b.nama} nominal={b.nominal} jatuh_tempo={b.jatuh_tempo} status={b.status} onPay={() => bayar(b)} />
              <input type="file" aria-label={`bukti-${b.id}`} onChange={(e) => pilihBukti(e, b)} />
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>Semua tagihan</h2>
        {sisanya.map((b: any) => (
          <div key={b.id}>
            <BillCard nama={b.nama} nominal={b.nominal} jatuh_tempo={b.jatuh_tempo} status={b.status} onPay={() => bayar(b)} />
          </div>
        ))}
      </section>
      {tagihan.length === 0 && !gagalMuat && <p>Belum ada tagihan, santai dulu ya</p>}
      {gagalMuat && <p>Gagal memuat tagihan, coba lagi ya</p>}
      {pesan && <p>{pesan}</p>}
    </div>
  );
}
