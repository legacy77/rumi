"use client";
import { useEffect, useState } from "react";
import TaskRow from "@/components/TaskRow";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { SkeletonList } from "@/components/Skeleton";
import { useHousehold } from "@/lib/household-context";

type Filter = "milikku" | "hariIni" | "selesai";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "milikku", label: "Milikku" },
  { id: "hariIni", label: "Hari ini" },
  { id: "selesai", label: "Selesai" },
];

export default function TugasPage({ tugasAwal = [], userId: userIdProp }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const householdId = ctx?.id ?? null;
  const userId = userIdProp ?? ctx?.userId ?? null;
  const [tugas, setTugas] = useState<any[]>(tugasAwal);
  const [filter, setFilter] = useState<Filter>("milikku");
  const [pendingSync, setPendingSync] = useState<string[]>([]);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [judulBaru, setJudulBaru] = useState("");
  const [pesanTambah, setPesanTambah] = useState("");

  useEffect(() => {
    if (tugasAwal.length > 0 || !householdId) return;
    let batal = false;
    setMemuat(true);
    fetch(`/api/tasks?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => {
        if (!batal && Array.isArray(d)) setTugas(d);
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
  }, [tugasAwal.length, householdId]);

  const hariIni = new Date().toISOString().slice(0, 10);
  const identitasHilang = !userId;
  const tampil = tugas.filter((t: any) => {
    if (filter === "milikku") return userId ? t.assignee_id === userId : false;
    if (filter === "hariIni") return t.deadline === hariIni;
    return t.status === "done";
  });

  async function toggle(t: any) {
    const next = t.status === "done" ? "todo" : "done";
    setTugas((semua) => semua.map((x: any) => (x.id === t.id ? { ...x, status: next } : x)));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: t.id, household_id: householdId, status: next }),
      });
      if (!res.ok) throw new Error("gagal");
      setPendingSync((p) => p.filter((id) => id !== t.id));
    } catch {
      setTugas((semua) => semua.map((x: any) => (x.id === t.id ? { ...x, status: t.status } : x)));
      setPendingSync((p) => (p.includes(t.id) ? p : [...p, t.id]));
    }
  }

  async function tugaskan(t: any) {
    if (!userId) return;
    const lama = t.assignee_id;
    setTugas((semua) => semua.map((x: any) => (x.id === t.id ? { ...x, assignee_id: userId } : x)));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: t.id, household_id: householdId, assignee_id: userId }),
      });
      if (!res.ok) throw new Error("gagal");
      setPendingSync((p) => p.filter((id) => id !== t.id));
    } catch {
      setTugas((semua) => semua.map((x: any) => (x.id === t.id ? { ...x, assignee_id: lama } : x)));
      setPendingSync((p) => (p.includes(t.id) ? p : [...p, t.id]));
    }
  }

  async function tambah() {
    const judul = judulBaru.trim();
    if (!judul) {
      setPesanTambah("Judul tugas wajib diisi");
      return;
    }
    setPesanTambah("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        household_id: householdId,
        judul,
        ...(userId ? { assignee_id: userId } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPesanTambah(data.error ?? "Gagal bikin tugas, coba lagi ya");
      return;
    }
    setTugas((semua) => [data, ...semua]);
    setJudulBaru("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tugas" description="Siapa kerjakan apa, hari ini." />

      <section aria-label="Tambah tugas" className="rumi-card bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label="Judul tugas"
            placeholder="Judul tugas"
            value={judulBaru}
            onChange={(e) => setJudulBaru(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") tambah();
            }}
            className="min-h-12 flex-1 rounded-blob-sm border-2 border-ink bg-cream px-4 text-sm text-ink placeholder:text-muted/70"
          />
          <button
            onClick={tambah}
            className="rumi-transition inline-flex min-h-12 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
          >
            Tambah tugas
          </button>
        </div>
        {pesanTambah && <p className="mt-2 text-sm text-terracotta">{pesanTambah}</p>}
      </section>

      <div role="tablist" aria-label="Filter tugas" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              className={`rumi-transition inline-flex min-h-12 items-center rounded-blob-sm border-2 border-ink px-4 text-sm ${
                on ? "bg-ink font-semibold text-white shadow-doodle-sm" : "bg-white text-ink hover:bg-cream"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {identitasHilang && (
        <p className="rounded-blob-sm border-2 border-ink bg-surface px-4 py-3 text-sm text-muted">
          Masuk dulu ya biar filter Milikku dan ambil tugas jalan
        </p>
      )}

      <section aria-label="Daftar tugas" aria-busy={memuat || undefined}>
        {memuat && !gagalMuat ? (
          <SkeletonList count={4} label="Memuat tugas" />
        ) : (
          <ul className="rumi-card divide-y divide-hairline overflow-hidden bg-white px-4">
            {tampil.map((t: any) => (
              <li key={t.id} className="rumi-row py-1 last:border-b-0">
                <TaskRow
                  id={t.id}
                  judul={t.judul}
                  assignee={t.assignee_id === userId ? "Aku" : t.assignee_id}
                  status={t.status}
                  onToggle={() => toggle(t)}
                  onAssign={userId ? () => tugaskan(t) : undefined}
                />
                {pendingSync.includes(t.id) && (
                  <p className="pb-2 pl-11 text-xs text-muted">menunggu sync</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {!memuat && tampil.length === 0 && !gagalMuat && (
          filter === "milikku" && !userId ? (
            <div className="pt-4">
              <EmptyState
                title="Belum bisa filter Milikku, masuk dulu ya"
                gambar="/doodle/santai.svg"
              />
            </div>
          ) : (
            <div className="pt-4">
              <EmptyState title="Belum ada tugas, santai dulu ya" gambar="/doodle/santai.svg" />
            </div>
          )
        )}
        {gagalMuat && (
          <div className="pt-4">
            <ErrorState text="Gagal memuat tugas, coba lagi ya" />
          </div>
        )}
      </section>
    </div>
  );
}
