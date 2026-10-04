"use client";
import { useEffect, useState } from "react";
import TaskRow from "@/components/TaskRow";
import { useHousehold } from "@/lib/household-context";

type Filter = "milikku" | "hariIni" | "selesai";

export default function TugasPage({ tugasAwal = [], userId: userIdProp }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const householdId = ctx?.id ?? null;
  const userId = userIdProp ?? ctx?.userId ?? null;
  const [tugas, setTugas] = useState<any[]>(tugasAwal);
  const [filter, setFilter] = useState<Filter>("milikku");
  const [pendingSync, setPendingSync] = useState<string[]>([]);
  const [gagalMuat, setGagalMuat] = useState(false);

  useEffect(() => {
    if (tugasAwal.length > 0 || !householdId) return;
    fetch(`/api/tasks?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => Array.isArray(d) && setTugas(d))
      .catch(() => setGagalMuat(true));
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

  return (
    <div>
      <h1>Tugas</h1>
      <div>
        <button onClick={() => setFilter("milikku")}>Milikku</button>
        <button onClick={() => setFilter("hariIni")}>Hari ini</button>
        <button onClick={() => setFilter("selesai")}>Selesai</button>
      </div>
      {identitasHilang && <p>Masuk dulu ya biar filter Milikku dan ambil tugas jalan</p>}
      {tampil.map((t: any) => (
        <div key={t.id}>
          <TaskRow
            id={t.id}
            judul={t.judul}
            assignee={t.assignee_id === userId ? "Aku" : t.assignee_id}
            status={t.status}
            onToggle={() => toggle(t)}
            onAssign={userId ? () => tugaskan(t) : undefined}
          />
          {pendingSync.includes(t.id) && <p>menunggu sync</p>}
        </div>
      ))}
      {tampil.length === 0 && !gagalMuat && (
        filter === "milikku" && !userId ? (
          <p>Belum bisa filter Milikku, masuk dulu ya</p>
        ) : (
          <p>Belum ada tugas, santai dulu ya</p>
        )
      )}
      {gagalMuat && <p>Gagal memuat tugas, coba lagi ya</p>}
    </div>
  );
}
