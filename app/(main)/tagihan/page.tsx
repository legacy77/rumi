"use client";
import { useEffect, useState } from "react";
import BillCard from "@/components/BillCard";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { Skeleton } from "@/components/Skeleton";
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

function rupiah(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n ?? "—");
  return `Rp${v.toLocaleString("id-ID")}`;
}

export default function TagihanPage({ tagihanAwal = [] }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const householdId = ctx?.id ?? null;
  const [tagihan, setTagihan] = useState<any[]>(tagihanAwal);
  const [memuat, setMemuat] = useState(tagihanAwal.length === 0 && householdId != null);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (tagihanAwal.length > 0 || !householdId) {
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    fetch(`/api/bills?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => {
        if (!batal && Array.isArray(d)) setTagihan(d);
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
  }, [tagihanAwal.length, householdId]);

  const mendesak = tagihan.filter((b: any) => b.status !== "lunas" && dalamH3(b.jatuh_tempo));
  const sisanya = tagihan.filter((b: any) => !(b.status !== "lunas" && dalamH3(b.jatuh_tempo)));
  const totalBelum = tagihan.filter((b: any) => b.status !== "lunas").reduce((s: number, b: any) => s + (Number(b.nominal) || 0), 0);

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
    setSibuk(true);
    try {
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
    } finally {
      setSibuk(false);
    }
  }

  if (memuat) {
    return (
      <div className="space-y-8">
        <PageHeader title="Tagihan" description="Catat yang wajib dibayar, lunasi yang mendesak." />
        <div role="status" aria-label="Memuat tagihan" aria-busy="true" className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-blob" />
          <Skeleton className="h-24 w-full rounded-blob" />
          <Skeleton className="h-24 w-full rounded-blob" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tagihan"
        description={
          tagihan.length > 0
            ? `${mendesak.length} mendesak · ${rupiah(totalBelum)} belum lunas`
            : "Catat yang wajib dibayar, lunasi yang mendesak."
        }
      />

      <section aria-label="Tambah tagihan" className="rumi-card bg-white px-5 py-5 sm:px-6">
        <h2 className="text-sm font-semibold text-ink">Tagihan baru</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_10rem_11rem_auto]">
          <div>
            <label htmlFor="bill-nama" className="sr-only">Nama tagihan</label>
            <input
              id="bill-nama"
              placeholder="Nama tagihan"
              aria-label="Nama tagihan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="min-h-12 w-full rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm text-ink placeholder:text-muted/70"
            />
          </div>
          <div>
            <label htmlFor="bill-nominal" className="sr-only">Nominal</label>
            <input
              id="bill-nominal"
              placeholder="Nominal"
              aria-label="Nominal"
              inputMode="numeric"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              className="min-h-12 w-full rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm tabular-nums text-ink placeholder:text-muted/70"
            />
          </div>
          <div>
            <label htmlFor="bill-tempo" className="sr-only">Jatuh tempo</label>
            <input
              id="bill-tempo"
              type="date"
              aria-label="Jatuh tempo"
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="min-h-12 w-full rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm text-ink"
            />
          </div>
          <button
            onClick={tambah}
            disabled={sibuk}
            className="rumi-transition inline-flex min-h-12 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
          >
            Tambah tagihan
          </button>
        </div>
      </section>

      {mendesak.length > 0 && (
        <section aria-label="Mendesak">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-terracotta">Jatuh tempo ≤ H-3</h2>
            <span className="text-xs tabular-nums text-muted">{mendesak.length} tagihan</span>
          </div>
          <ul className="mt-3 space-y-3">
            {mendesak.map((b: any) => (
              <li key={b.id} className="rumi-card-alt rounded-blob border-2 border-ink bg-surface p-3 shadow-doodle-sm">
                <BillCard nama={b.nama} nominal={b.nominal} jatuh_tempo={b.jatuh_tempo} status={b.status} onPay={() => bayar(b)} />
                <label className="rumi-transition inline-flex min-h-12 w-fit cursor-pointer items-center gap-2 px-1 text-xs text-muted hover:text-ink">
                  <input type="file" aria-label={`bukti-${b.id}`} onChange={(e) => pilihBukti(e, b)} className="sr-only" />
                  <span aria-hidden="true" className="inline-block h-px w-5 bg-ink/40" />
                  Lampirkan bukti / tandai tanpa bukti
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Daftar tagihan">
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Semua tagihan</h2>
          <span className="text-xs tabular-nums text-muted">{sisanya.length} tagihan</span>
        </div>
        {sisanya.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {sisanya.map((b: any) => (
              <li key={b.id} className="rounded-blob border-2 border-ink bg-surface p-3 shadow-doodle-sm">
                <BillCard nama={b.nama} nominal={b.nominal} jatuh_tempo={b.jatuh_tempo} status={b.status} onPay={() => bayar(b)} />
              </li>
            ))}
          </ul>
        ) : (
          mendesak.length > 0 && <p className="mt-4 text-sm text-muted">Sisanya sudah aman.</p>
        )}
      </section>

      {tagihan.length === 0 && !gagalMuat && (
        <EmptyState
          title="Belum ada tagihan, santai dulu ya"
          detail="Tambah tagihan pertama di atas biar nggak ada yang kelewat."
          gambar="/doodle/santai.svg"
        />
      )}
      {gagalMuat && <ErrorState text="Gagal memuat tagihan, coba lagi ya" />}
      {pesan && <p role="status" className="text-sm text-terracotta">{pesan}</p>}
    </div>
  );
}
