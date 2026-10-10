"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/ContentState";
import { Skeleton } from "@/components/Skeleton";

export default function KeluargaPage({ members: awal = [], myRole }: any) {
  const ctx = useHousehold();
  const role = myRole ?? ctx?.role ?? "member";
  const householdId = ctx?.id ?? null;
  const currentUserId = ctx?.userId ?? "";
  const [members, setMembers] = useState<any[]>(awal);
  const [link, setLink] = useState("");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [mengundang, setMengundang] = useState(false);
  const [mengeluarkan, setMengeluarkan] = useState<string | null>(null);
  const [gagalKeluarkan, setGagalKeluarkan] = useState("");
  const [namaSaya, setNamaSaya] = useState(
    awal.find((m: any) => m.user_id === currentUserId)?.nama ?? ""
  );
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (awal.length > 0 || !householdId) return;
    let batal = false;
    setMemuat(true);
    setGagalMuat(false);
    fetch(`/api/members?household_id=${householdId}`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((d) => {
        if (!batal && Array.isArray(d)) setMembers(d);
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

  async function undang() {
    setPesan("");
    setMengundang(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal bikin undangan, coba lagi ya");
        return;
      }
      setLink(`${window.location.origin}${data.url}`);
    } catch {
      setPesan("Gagal bikin undangan, coba lagi ya");
    } finally {
      setMengundang(false);
    }
  }

  async function keluarkan(targetId: string) {
    if (!window.confirm("Keluarkan anggota ini dari rumah?")) return;
    setGagalKeluarkan("");
    setMengeluarkan(targetId);
    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId, user_id: targetId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGagalKeluarkan(data.error ?? "Gagal keluarkan anggota, coba lagi ya");
        return;
      }
      setMembers((prev) => prev.filter((m: any) => m.user_id !== targetId));
    } catch {
      setGagalKeluarkan("Gagal keluarkan anggota, coba lagi ya");
    } finally {
      setMengeluarkan(null);
    }
  }

  async function ubahRole(targetId: string, newRole: string) {
    setPesan("");
    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId, user_id: targetId, role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal ubah peran, coba lagi ya");
        return;
      }
      setMembers((prev) =>
        prev.map((m: any) => (m.user_id === targetId ? { ...m, role: newRole } : m))
      );
    } catch {
      setPesan("Gagal ubah peran, coba lagi ya");
    }
  }

  async function keluar() {
    if (!window.confirm("Yakin keluar dari rumah ini?")) return;
    setPesan("");
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ household_id: householdId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal keluar dari rumah, coba lagi ya");
        return;
      }
      setMembers((prev) => prev.filter((m: any) => m.user_id !== currentUserId));
      setPesan("Kamu telah keluar dari rumah ini.");
    } catch {
      setPesan("Gagal keluar dari rumah, coba lagi ya");
    }
  }

  async function simpanNama() {
    setMenyimpan(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nama: namaSaya }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPesan(data.error ?? "Gagal simpan nama, coba lagi ya");
        return;
      }
      // Refetch untuk dapat nama terbaru dari database (mis. trimming).
      const r2 = await fetch(`/api/members?household_id=${householdId}`);
      if (r2.ok) {
        const d = await r2.json();
        setMembers(d);
        const m = (d as any[]).find((x: any) => x.user_id === currentUserId);
        if (m) setNamaSaya(m.nama);
      }
    } catch {
      setPesan("Gagal simpan nama, coba lagi ya");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Keluarga" description="Orang-orang yang berbagi rumah ini." />

      <section aria-label="Anggota keluarga" className="max-w-3xl space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">Anggota keluarga</h2>
          {!memuat && !gagalMuat && <span className="text-xs tabular-nums text-muted">{members.length} anggota</span>}
        </div>

        {memuat ? (
          <div role="status" aria-label="Memuat anggota keluarga" aria-busy="true" className="rumi-card overflow-hidden">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rumi-row flex items-center justify-between gap-4 px-5 py-5 last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : gagalMuat ? (
          <div><ErrorState text="Gagal memuat anggota keluarga, coba lagi ya" /></div>
        ) : members.length === 0 ? (
          <div><EmptyState gambar="/doodle/keluarga.svg" title="Belum ada anggota keluarga" detail="Undang orang serumah lewat link di bawah." /></div>
        ) : (
          <ul className="rumi-card rumi-card-alt overflow-hidden">
            {members.map((m: any) => (
              <li key={m.user_id ?? m.nama ?? m.id} className="rumi-row flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-ink">{m.nama}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted">{m.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  {role === "admin" && m.user_id !== currentUserId && (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => ubahRole(m.user_id, e.target.value)}
                        className="rounded-xl border border-line bg-surface px-2 py-1 text-sm text-ink"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => keluarkan(m.user_id)}
                        disabled={mengeluarkan === m.user_id}
                        className="rumi-transition min-h-11 rounded-blob-sm border-2 border-ink bg-surface px-3 text-sm text-muted shadow-doodle-sm hover:text-ink disabled:opacity-50"
                      >
                        {mengeluarkan === m.user_id ? "mengeluarkan…" : "Keluarkan"}
                      </button>
                    </>
                  )}
                  {m.user_id === currentUserId && (
                    <button
                      type="button"
                      onClick={keluar}
                      className="rumi-transition min-h-11 rounded-xl border-2 border-line bg-surface px-3 text-sm text-ink hover:bg-line/10"
                    >
                      Keluar dari rumah
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {gagalKeluarkan && <div><ErrorState text={gagalKeluarkan} /></div>}
      </section>

      {role === "admin" && (
        <section className="max-w-3xl border-t border-line pt-7" aria-label="Undang anggota">
          <h2 className="text-base font-semibold tracking-tight text-ink">Undang anggota</h2>
          <p className="mt-1 max-w-md text-sm text-muted">Buat link untuk mengajak orang serumah bergabung.</p>
          <button
            type="button"
            onClick={undang}
            disabled={mengundang || !householdId}
            className="rumi-transition mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-terracotta px-5 text-sm font-semibold text-white hover:opacity-85"
          >
            {mengundang ? "Membuat link…" : "Undang via link"}
          </button>
          {link && (
            <div className="mt-6 max-w-xl">
              <label htmlFor="link-undangan" className="mb-2 block text-sm font-medium text-ink">Bagikan link ini:</label>
              <input
                id="link-undangan"
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              />
            </div>
          )}
          {pesan && <div><ErrorState text={pesan} /></div>}
        </section>
      )}

      {/* Nama kamu — bisa diubah oleh siapa saja (admin atau member). */}
      <section className="max-w-3xl border-t border-line pt-7" aria-label="Nama kamu">
        <h2 className="text-base font-semibold tracking-tight text-ink">Nama kamu</h2>
        <p className="mt-1 max-w-md text-sm text-muted">Ubah nama yang tampil di rumah ini.</p>
        <div className="mt-5 flex gap-3">
          <input
            type="text"
            value={namaSaya}
            onChange={(e) => setNamaSaya(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
          />
          <button
            type="button"
            onClick={simpanNama}
            disabled={menyimpan || !householdId}
            className="rumi-transition min-h-11 rounded-xl bg-terracotta px-5 text-sm font-semibold text-white hover:opacity-85 disabled:opacity-50"
          >
            {menyimpan ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </section>

      {/* Pesan global untuk operasi lain (undang, keluar, ubah peran, simpan nama). */}
      {pesan && <div><ErrorState text={pesan} /></div>}
    </div>
  );
}
