"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { SkeletonList } from "@/components/Skeleton";
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
  const [memuat, setMemuat] = useState<boolean>(Boolean(householdId) && awal.length === 0);
  const [pesan, setPesan] = useState("");
  const [nama, setNama] = useState("");
  const adaPerlu = daftar.some((x: any) => x.status !== "dibeli");
  const adaDibeli = daftar.some((x: any) => x.status === "dibeli");

  useEffect(() => {
    if (awal.length > 0 || !householdId) return;
    let batal = false;
    setMemuat(true);
    fetch(`/api/shopping?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => {
        if (!batal && Array.isArray(d)) setDaftar(normalisasi(d));
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
    <div className="space-y-6">
      <PageHeader title="Belanja" description="Daftar belanjaan rumah." />

      <section aria-label="Tambah barang" className="rumi-card bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label="Nama barang"
            placeholder="Nama barang"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") tambah();
            }}
            className="min-h-12 flex-1 rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm text-ink placeholder:text-muted/70"
          />
          <button
            onClick={tambah}
            className="rumi-transition inline-flex min-h-12 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
          >
            Tambah barang
          </button>
        </div>
        {pesan && <p className="mt-2 text-sm text-terracotta">{pesan}</p>}
      </section>

      {(adaPerlu || adaDibeli) && (
        <div className="flex flex-wrap items-center gap-2">
          {adaPerlu && (
            <button
              onClick={tandaiSemua}
              className="rumi-transition inline-flex min-h-12 items-center rounded-blob-sm border-2 border-ink bg-ink px-4 text-sm font-medium text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
            >
              Tandai semua dibeli
            </button>
          )}
          {adaDibeli && (
            <button
              onClick={hapusDibeli}
              className="rumi-transition inline-flex min-h-12 items-center rounded-blob-sm border-2 border-ink bg-white px-4 text-sm font-medium text-ink hover:bg-cream active:translate-y-px"
            >
              Hapus yang dibeli
            </button>
          )}
        </div>
      )}

      <section aria-label="Daftar belanja" aria-busy={memuat || undefined}>
        {memuat && !gagalMuat ? (
          <SkeletonList count={4} label="Memuat belanja" />
        ) : (
          <ul className="rumi-card divide-y divide-hairline overflow-hidden bg-white px-4">
            {daftar.map((item: any, i: number) => {
              const dibeli = item.status === "dibeli";
              return (
                <li key={item.id ?? `idx-${i}`} className="rumi-row last:border-b-0">
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-[#D97757]"
                      checked={dibeli}
                      onChange={() => toggle(item)}
                      aria-label={item.nama}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        dibeli ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {item.nama}
                    </span>
                    <span
                      className={`shrink-0 rounded-blob-sm border-2 px-2 py-0.5 text-xs ${
                        dibeli ? "border-ink/20 text-muted" : "border-terracotta text-terracotta"
                      }`}
                    >
                      {dibeli ? "beres ✓" : "perlu"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {!memuat && daftar.length === 0 && !gagalMuat && (
          <div className="pt-4">
            <EmptyState title="Belum ada barang, santai dulu ya" gambar="/doodle/belanja.svg" />
          </div>
        )}
        {gagalMuat && (
          <div className="pt-4">
            <ErrorState text="Gagal memuat belanja, coba lagi ya" />
          </div>
        )}
      </section>
    </div>
  );
}
