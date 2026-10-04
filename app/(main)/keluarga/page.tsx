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
  const [members, setMembers] = useState<any[]>(awal);
  const [link, setLink] = useState("");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [mengundang, setMengundang] = useState(false);

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
              <li key={m.id ?? m.nama} className="rumi-row flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-ink">{m.nama}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted">{m.role}</p>
                </div>
                {role === "admin" && m.role !== "admin" && (
                  <button type="button" className="rumi-transition min-h-11 rounded-blob-sm border-2 border-ink bg-surface px-3 text-sm text-muted shadow-doodle-sm hover:text-ink">Keluarkan</button>
                )}
              </li>
            ))}
          </ul>
        )}
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
          {pesan && <div className="mt-4"><ErrorState text={pesan} /></div>}
        </section>
      )}
    </div>
  );
}
