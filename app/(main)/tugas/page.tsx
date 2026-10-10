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
  const [pengulanganBaru, setPengulanganBaru] = useState("sekali");
  const [pesanTambah, setPesanTambah] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    judul: string;
    deskripsi: string;
    deadline: string;
    prioritas: string;
    pengulangan: string;
  }>({ judul: "", deskripsi: "", deadline: "", prioritas: "normal", pengulangan: "sekali" });

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

  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
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
      const data = await res.json().catch(() => null);
      // Instance berulang berikutnya: tambahkan tanpa perlu muat ulang.
      if (data?.tugasBerikut?.id) {
        const berikut = data.tugasBerikut;
        setTugas((semua) => (semua.some((x: any) => x.id === berikut.id) ? semua : [berikut, ...semua]));
      }
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
        pengulangan: pengulanganBaru,
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
    setPengulanganBaru("sekali");
  }

  async function mulaiEdit(t: any) {
    setEditingId(t.id);
    setEditForm({
      judul: t.judul ?? "",
      deskripsi: t.deskripsi ?? "",
      deadline: t.deadline ?? "",
      prioritas: t.prioritas ?? "normal",
      pengulangan: t.pengulangan ?? "sekali",
    });
  }

  async function simpanEdit(t: any) {
    const judul = editForm.judul.trim();
    if (judul === "") {
      setPesanTambah("Judul tugas wajib diisi");
      return;
    }
    const lama = t;
    setTugas((semua) => semua.map((x) => (x.id === t.id ? { ...x, judul } : x)));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          household_id: householdId,
          judul,
          deskripsi: editForm.deskripsi,
          deadline: editForm.deadline || null,
          prioritas: editForm.prioritas,
          pengulangan: editForm.pengulangan,
        }),
      });
      if (!res.ok) throw new Error("gagal");
      const updated = await res.json();
      setTugas((semua) => semua.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
      setPendingSync((p) => p.filter((id) => id !== t.id));
      setEditingId(null);
      setPesanTambah("");
    } catch (err: any) {
      setTugas((semua) => semua.map((x) => (x.id === t.id ? lama : x)));
      setPendingSync((p) => (p.includes(t.id) ? p : [...p, t.id]));
      setPesanTambah(err.message ?? "Gagal update tugas, coba lagi ya");
    }
  }

  async function hapus(t: any) {
    if (!window.confirm("Hapus tugas ini?")) return;
    const lama = t;
    setTugas((semua) => semua.filter((x) => x.id !== t.id));
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: t.id, household_id: householdId }),
      });
      if (!res.ok) throw new Error("gagal");
      setPendingSync((p) => p.filter((id) => id !== t.id));
    } catch (err: any) {
      setTugas((semua) => [lama, ...semua]);
      setPendingSync((p) => (p.includes(t.id) ? p : [...p, t.id]));
      setPesanTambah(err.message ?? "Gagal hapus tugas, coba lagi ya");
    }
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
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
            Pengulangan
            <select
              aria-label="Pengulangan"
              value={pengulanganBaru}
              onChange={(e) => setPengulanganBaru(e.target.value)}
              className="min-h-12 rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink"
            >
              <option value="sekali">Sekali</option>
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
            </select>
          </label>
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
                  deskripsi={t.deskripsi}
                  assignee={t.assignee_id === userId ? "Aku" : t.assignee_id}
                  status={t.status}
                  deadline={t.deadline}
                  prioritas={t.prioritas}
                  pengulangan={t.pengulangan}
                  onToggle={() => toggle(t)}
                  onAssign={userId ? () => tugaskan(t) : undefined}
                  onEdit={() => mulaiEdit(t)}
                  onDelete={() => hapus(t)}
                />
                {editingId === t.id && (
                  <div className="mb-2 mt-1 space-y-3 rounded-blob-sm border-2 border-ink bg-cream p-3">
                    <input
                      aria-label="Judul"
                      placeholder="Judul tugas"
                      value={editForm.judul}
                      onChange={(e) => setEditForm((f) => ({ ...f, judul: e.target.value }))}
                      className="min-h-12 w-full rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink placeholder:text-muted/70"
                    />
                    <textarea
                      aria-label="Deskripsi"
                      placeholder="Deskripsi (opsional)"
                      value={editForm.deskripsi}
                      onChange={(e) => setEditForm((f) => ({ ...f, deskripsi: e.target.value }))}
                      className="min-h-12 w-full rounded-blob-sm border-2 border-ink bg-white px-4 py-2 text-sm text-ink placeholder:text-muted/70"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
                        Deadline
                        <input
                          type="date"
                          aria-label="Deadline"
                          value={editForm.deadline}
                          onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                          className="min-h-12 rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink"
                        />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
                        Prioritas
                        <select
                          aria-label="Prioritas"
                          value={editForm.prioritas}
                          onChange={(e) => setEditForm((f) => ({ ...f, prioritas: e.target.value }))}
                          className="min-h-12 rounded-blob-sm border-2 border-ink bg-white px-4 text-sm text-ink"
                        >
                          <option value="rendah">Rendah</option>
                          <option value="normal">Normal</option>
                          <option value="penting">Penting</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => simpanEdit(t)}
                        className="rumi-transition inline-flex min-h-12 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:translate-y-px"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setPesanTambah("");
                        }}
                        className="rumi-transition inline-flex min-h-12 items-center justify-center rounded-blob-sm border-2 border-ink bg-white px-5 text-sm font-semibold text-ink hover:bg-cream"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
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
