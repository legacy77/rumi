import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tagihan" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
