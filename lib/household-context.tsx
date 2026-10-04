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
  return <Ctx.Provider value={{ ...cur, userId, switchHousehold: setCur }}>{children}</Ctx.Provider>;
}
export const useHousehold = () => useContext(Ctx);
