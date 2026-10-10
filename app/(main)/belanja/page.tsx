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
  const [jumlah, setJumlah] = useState("1");
  const [catatan, setCatatan] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editJumlah, setEditJumlah] = useState("1");
  const [editCatatan, setEditCatatan] = useState("");
  const adaPerlu = daftar.some((x: any) => x.status !== "dibeli");
  const adaDibeli = daftar.some((x: any) => x.status === "dibeli");
  const riwayat = daftar.filter((x: any) => x.status === "dibeli");
  const favorit = (() => {
    const grup = new Map<string, { nama: string; jumlah: string; catatan: string; count: number }>();
    for (const x of daftar) {
      const kunci = String(x?.nama ?? "").trim().toLowerCase();
      if (kunci === "") continue;
      const ada = grup.get(kunci);
      if (ada) ada.count += 1;
      else grup.set(kunci, { nama: x.nama, jumlah: x.jumlah ?? "1", catatan: x.catatan ?? "", count: 1 });
    }
    return Array.from(grup.values())
      .filter((g) => g.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

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
      setDaftar((semua) => [...semua, ...normalisasi([{ nama: bersih, jumlah, catatan }])]);
      setNama("");
      setJumlah("1");
      setCatatan("");
      return;
    }
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId, nama: bersih, jumlah, catatan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal nambah barang, coba lagi ya");
        return;
      }
      setDaftar((semua) => [...semua, ...normalisasi([data])]);
      setNama("");
      setJumlah("1");
      setCatatan("");
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

  async function simpanEdit(item: any) {
    const j = editJumlah;
    const c = editCatatan;
    const lama = daftar;
    setDaftar((semua) => semua.map((x: any) => (x.id === item.id ? { ...x, jumlah: j, catatan: c } : x)));
    setEditId(null);
    if (!householdId) return;
    try {
      const res = await fetch("/api/shopping", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, household_id: householdId, status: item.status, jumlah: j, catatan: c }),
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      setDaftar(lama);
      setPesan("Gagal update barang, coba lagi ya");
    }
  }

  async function beliLagi(item: any) {
    setPesan("");
    const payload = {
      household_id: householdId,
      nama: item.nama,
      jumlah: item.jumlah ?? "1",
      catatan: item.catatan ?? "",
      status: "perlu",
    };
    if (!householdId) {
      setDaftar((semua) => [...semua, ...normalisasi([{ nama: item.nama, jumlah: payload.jumlah, catatan: payload.catatan }])]);
      return;
    }
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal nambah barang, coba lagi ya");
        return;
      }
      setDaftar((semua) => [...semua, ...normalisasi([data])]);
    } catch {
      setPesan("Gagal nambah barang, coba lagi ya");
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
          <input
            aria-label="Jumlah"
            placeholder="Jumlah"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") tambah();
            }}
            className="min-h-12 rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm text-ink placeholder:text-muted/70 sm:w-28"
          />
          <input
            aria-label="Catatan"
            placeholder="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
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
                      <span>{item.nama}</span>
                      <span className="ml-2 text-xs text-muted">× {item.jumlah}</span>
                      {item.catatan !== "" && (
                        <span className="ml-2 text-xs text-muted">· {item.catatan}</span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-blob-sm border-2 px-2 py-0.5 text-xs ${
                        dibeli ? "border-ink/20 text-muted" : "border-terracotta text-terracotta"
                      }`}
                    >
                      {dibeli ? "beres ✓" : "perlu"}
                    </span>
                  </label>
                  {editId === item.id ? (
                    <div className="flex flex-col gap-2 pb-3 pl-8">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          aria-label="Ubah jumlah"
                          placeholder="Jumlah"
                          value={editJumlah}
                          onChange={(e) => setEditJumlah(e.target.value)}
                          className="min-h-10 rounded-blob-sm border-2 border-ink bg-cream px-3 text-sm text-ink sm:w-28"
                        />
                        <input
                          aria-label="Ubah catatan"
                          placeholder="Catatan (opsional)"
                          value={editCatatan}
                          onChange={(e) => setEditCatatan(e.target.value)}
                          className="min-h-10 flex-1 rounded-blob-sm border-2 border-ink bg-cream px-3 text-sm text-ink"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => simpanEdit(item)}
                          className="rumi-transition inline-flex min-h-10 items-center rounded-blob-sm border-2 border-ink bg-terracotta px-4 text-xs font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rumi-transition inline-flex min-h-10 items-center rounded-blob-sm border-2 border-ink bg-white px-4 text-xs font-medium text-ink hover:bg-cream active:translate-y-px"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-2 pl-8">
                      <button
                        aria-label={`Ubah ${item.nama}`}
                        onClick={() => {
                          setEditId(item.id);
                          setEditJumlah(item.jumlah ?? "1");
                          setEditCatatan(item.catatan ?? "");
                        }}
                        className="text-xs font-medium text-muted underline underline-offset-2 hover:text-ink"
                      >
                        Ubah
                      </button>
                    </div>
                  )}
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

      {riwayat.length > 0 && (
        <section aria-label="Sudah dibeli" className="rumi-card bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink">Sudah dibeli</h2>
          <ul className="mt-2 divide-y divide-hairline">
            {riwayat.map((item: any, i: number) => (
              <li key={item.id ?? `riwayat-${i}`} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm text-muted">
                  <span className="line-through">{item.nama}</span>
                  <span className="ml-2 text-xs">× {item.jumlah}</span>
                  {item.catatan !== "" && <span className="ml-2 text-xs">· {item.catatan}</span>}
                </span>
                <button
                  aria-label={`Beli lagi ${item.nama}`}
                  onClick={() => beliLagi(item)}
                  className="rumi-transition inline-flex min-h-10 shrink-0 items-center rounded-blob-sm border-2 border-ink bg-white px-3 text-xs font-medium text-ink hover:bg-cream active:translate-y-px"
                >
                  Beli lagi
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {favorit.length > 0 && (
        <section aria-label="Sering dibeli" className="rumi-card bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink">Sering dibeli</h2>
          <ul className="mt-2 divide-y divide-hairline">
            {favorit.map((f, i) => (
              <li key={`${f.nama.toLowerCase()}-${i}`} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm text-ink">
                  <span>{f.nama}</span>
                  <span className="ml-2 text-xs text-muted">×{f.count}</span>
                </span>
                <button
                  aria-label={`Tambah ${f.nama}`}
                  onClick={() => beliLagi(f)}
                  className="rumi-transition inline-flex min-h-10 shrink-0 items-center rounded-blob-sm border-2 border-ink bg-terracotta px-3 text-xs font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
                >
                  Tambah
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
