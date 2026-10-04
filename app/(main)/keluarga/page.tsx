"use client";
import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";

export default function KeluargaPage({ members: awal = [], myRole }: any) {
  const ctx = useHousehold ? useHousehold() : null;
  const role = myRole ?? ctx?.role ?? "member";
  const householdId = ctx?.id ?? null;
  const [members, setMembers] = useState<any[]>(awal);
  const [link, setLink] = useState("");
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    if (awal.length > 0 || !householdId) return;
    fetch(`/api/members?household_id=${householdId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setMembers(d))
      .catch(() => {});
  }, [awal.length, householdId]);

  async function undang() {
    setPesan("");
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
  }

  return (
    <div>
      <h1>Keluarga</h1>
      {members.map((m: any) => (
        <div key={m.nama}>
          {m.nama} · {m.role}{" "}
          {role === "admin" && m.role !== "admin" && <button>Keluarkan</button>}
        </div>
      ))}
      {role === "admin" && <button onClick={undang}>Undang via link</button>}
      {link && (
        <p>
          Bagikan link ini: <input readOnly value={link} onFocus={(e) => e.target.select()} />
        </p>
      )}
      {pesan && <p>{pesan}</p>}
    </div>
  );
}
