"use client";
import { createContext, useContext, useState } from "react";
const Ctx = createContext<any>(null);
export function HouseholdProvider({ initial, children }: any) {
  const [cur, setCur] = useState(initial);
  return <Ctx.Provider value={{ ...cur, switchHousehold: setCur }}>{children}</Ctx.Provider>;
}
export const useHousehold = () => useContext(Ctx);
