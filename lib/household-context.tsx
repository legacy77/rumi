"use client";
import { createContext, useContext, useEffect, useState } from "react";
const Ctx = createContext<any>(null);

export function HouseholdProvider({ initial, children }: any) {
  const [cur, setCur] = useState(initial);
  const [userId, setUserId] = useState(initial?.userId ?? null);
  useEffect(() => {
    if (userId) return;
    if (typeof fetch === "undefined") return;
    let batal = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!batal && d?.id) setUserId(d.id);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [userId]);

  const refetch = async () => {
    if (typeof fetch === "undefined") return null;
    try {
      const res = await fetch("/api/households");
      if (!res.ok) return null;
      const baris = await res.json();
      const daftar = (Array.isArray(baris) ? baris : [])
        .map((m: any) => ({ id: m?.households?.id, nama: m?.households?.nama, role: m?.role }))
        .filter((h: any) => h.id);
      if (daftar.length) {
        setCur(daftar[0]);
      }
      return daftar;
    } catch {
      return null;
    }
  };

  return (
    <Ctx.Provider value={{ ...cur, userId, switchHousehold: setCur, refetch }}>
      {children}
    </Ctx.Provider>
  );
}

export const useHousehold = () => useContext(Ctx);
