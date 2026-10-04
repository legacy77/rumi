"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";

function normalisasi(items: any[]) {
  return (Array.isArray(items) ? items : []).map((x: any, i: number) => ({
    id: typeof x?.id === "string" && x.id !== "" ? x.id : `tmp-${i}`,
    nama: typeof x?.nama === "string" ? x.nama : "",
    jumlah: typeof x?.jumlah === "string" ? x.jumlah : "1",
    catatan: typeof x?.catatan === "string" ? x.catatan : "",
    status: x?.status === "dibeli" ? "dibeli" : "perlu",
  }));
}

export default function BelanjaPage({ items = [], itemsAwal }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const householdId = ctx?.id ?? null;
  const awal = itemsAwal ?? items;
  const [daftar, setDaftar] = useState<any[]>(() => normalisasi(awal));
  const [gagalMuat, setGagalMuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [nama, setNama] = useState("");
  const adaPerlu = daftar.some((x: any) => x.status !== "dibeli");
  const adaDibeli = daftar.some((x: any) => x.status === "dibeli");

  useEffect(() => {
    if (awal.length > 0 || !householdId) return;
    fetch(`/api/shopping?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => Array.isArray(d) && setDaftar(normalisasi(d)))
      .catch(() => setGagalMuat(true));
  }, [awal.length, householdId]);

  async function tambah() {
    const bersih = nama.trim();
    if (bersih === "") {
      setPesan("Nama barang wajib diisi");
      return;
    }
    setPesan("");
    if (!householdId) {
      setDaftar((semua) => [...semua, ...normalisasi([{ nama: bersih }])]);
      setNama("");
      return;
    }
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId, nama: bersih }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal nambah barang, coba lagi ya");
        return;
      }
      setDaftar((semua) => [...semua, ...normalisasi([data])]);
      setNama("");
    } catch {
      setPesan("Gagal nambah barang, coba lagi ya");
    }
  }

  async function toggle(item: any) {
    const next = item.status === "dibeli" ? "perlu" : "dibeli";
    setDaftar((semua) => semua.map((x: any) => (x.id === item.id ? { ...x, status: next } : x)));
    if (!householdId) return;
    try {
      const res = await fetch("/api/shopping", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, household_id: householdId, status: next }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setDaftar((semua) => semua.map((x: any) => (x.id === item.id ? { ...x, status: item.status } : x)));
      setPesan("Gagal update barang, coba lagi ya");
    }
  }

  async function tandaiSemua() {
    const perlu = daftar.filter((x: any) => x.status !== "dibeli");
    if (perlu.length === 0) return;
    const ids = perlu.map((x: any) => x.id);
    const lama = daftar;
    setDaftar((semua) => semua.map((x: any) => ({ ...x, status: "dibeli" })));
    if (!householdId) return;
    try {
      const res = await fetch("/api/shopping", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids, household_id: householdId, status: "dibeli" }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setDaftar(lama);
      setPesan("Gagal tandai semua, coba lagi ya");
    }
  }

  async function hapusDibeli() {
    const dibeli = daftar.filter((x: any) => x.status === "dibeli");
    if (dibeli.length === 0) return;
    const lama = daftar;
    setDaftar((semua) => semua.filter((x: any) => x.status !== "dibeli"));
    if (!householdId) return;
    try {
      const res = await fetch(`/api/shopping?household_id=${householdId}&dibeli_saja=true`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setDaftar(lama);
      setPesan("Gagal hapus yang dibeli, coba lagi ya");
    }
  }

  return (
    <div>
      <h1>Belanja</h1>
      <div>
        <input
          placeholder="Nama barang"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="min-h-12"
        />
        <button onClick={tambah} className="min-h-12">
          Tambah barang
        </button>
      </div>
      <div>
        {adaPerlu && (
          <button onClick={tandaiSemua} className="min-h-12">
            Tandai semua dibeli
          </button>
        )}
        {adaDibeli && (
          <button onClick={hapusDibeli} className="min-h-12">
            Hapus yang dibeli
          </button>
        )}
      </div>
      <ul>
        {daftar.map((item: any, i: number) => (
          <li key={item.id ?? `idx-${i}`} className="min-h-12">
            <label className="min-h-12">
              <input
                type="checkbox"
                className="h-6 w-6"
                checked={item.status === "dibeli"}
                onChange={() => toggle(item)}
                aria-label={item.nama}
              />
              <span>{item.nama}</span>
            </label>
            <span>{item.status === "dibeli" ? "beres ✓" : "perlu"}</span>
          </li>
        ))}
      </ul>
      {daftar.length === 0 && !gagalMuat && <p>Belum ada barang, santai dulu ya</p>}
      {gagalMuat && <p>Gagal memuat belanja, coba lagi ya</p>}
      {pesan && <p>{pesan}</p>}
    </div>
  );
}
