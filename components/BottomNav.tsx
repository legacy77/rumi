"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

/**
 * DoodleIcon — ikon garis coretan untuk nav.
 * Digambar inline (tanpa dependensi): stroke 1.8px dengan sedikit
 * ketidaksempurnaan agar terasa digambar tangan. Dekoratif murni —
 * selalu `aria-hidden`, makna disampaikan label teks.
 */
function DoodleIcon({ nama, className = "" }: { nama: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    beranda: (
      <>
        <path d="M4 11.5 11.7 4.6c.4-.4 1-.4 1.4-.1l6.6 6.2" />
        <path d="M6.2 10.3c-.3 3.1-.5 6.3-.3 9.4 2.6-.4 5.3-.5 8-.4 2.4.1 4.7.3 7 .6.3-3.2.1-6.4-.3-9.6" />
        <path d="M10.2 19.6c.1-2.3.3-4.6.7-6.8 1.6.3 3.2.5 4.8.4-.2 2.1-.3 4.3-.3 6.4" />
      </>
    ),
    tugas: (
      <>
        <path d="M6 4.5c2.8-.5 5.7-.6 8.6-.4 1.6.1 3.2.3 4.7.7-.4 5.2-.5 10.4-.2 15.6-4.3.6-8.7.6-13 .1.3-5.3.2-10.7-.1-16Z" />
        <path d="M9.3 9.2l2.2 2.3 3.8-4.3" />
        <path d="M9.5 15.4c1.7-.3 3.5-.4 5.2-.2M9.4 18.6c1.4-.2 2.9-.2 4.3 0" />
      </>
    ),
    pengingat: (
      <>
        <path d="M12 3.8c3.6-.2 6.3 2.5 6.5 6.1.1 2.3-.5 4.3-1.4 6.3-.5 1-1 2-1.2 3.1-2.6.5-5.2.5-7.8 0-.2-1.1-.8-2.1-1.3-3.1C5.7 14 5.2 11.9 5.5 9.6c.3-3.2 3.1-5.6 6.5-5.8Z" />
        <path d="M10.2 20.8c.5 1 1.2 1.6 2 1.6s1.5-.6 1.7-1.6" />
        <path d="M12 3.8c0-1 .1-1.9.4-2.8M4.6 5.2 3.4 4.1M19.4 5.2l1.2-1.1" />
      </>
    ),
    belanja: (
      <>
        <path d="M5.2 8.2c2.3-.4 4.6-.5 6.9-.4 2.2.1 4.4.3 6.6.7.2 4.9 0 9.8-.6 14.6-4.3.5-8.5.4-12.7-.3.1-4.9 0-9.8-.2-14.6Z" />
        <path d="M8.8 8.3c-.2-2.4.9-4.7 2.9-5.2 2-.6 3.9.6 4.2 2.9.1.8.1 1.5 0 2.3" />
      </>
    ),
    keluarga: (
      <>
        <circle cx="8.6" cy="8.2" r="3.1" />
        <path d="M3.2 19.8c.2-3.2 2.4-5.3 5.4-5.4 2.9 0 5.1 2.3 5.3 5.4" />
        <circle cx="16" cy="9.5" r="2.4" />
        <path d="M15.4 14.7c2.3.2 4 1.9 4.2 4.4" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[nama]}
    </svg>
  );
}

const ITEMS = [
  { href: "/", label: "Beranda", ikon: "beranda" },
  { href: "/tugas", label: "Tugas", ikon: "tugas" },
  { href: "/pengingat", label: "Pengingat", ikon: "pengingat" },
  { href: "/belanja", label: "Belanja", ikon: "belanja" },
  { href: "/keluarga", label: "Keluarga", ikon: "keluarga" },
];

const MENU_SEMUA = [
  { href: "/tugas", label: "Tugas" },
  { href: "/belanja", label: "Belanja" },
  { href: "/tagihan", label: "Tagihan" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/pengingat", label: "Pengingat" },
];

/**
 * BottomNav — dock mengambang ala doodle untuk mobile (< lg).
 * Radius besar tak seragam, border tinta 2px, bayangan offset keras
 * (stiker), tombol Tambah miring sebagai aksen coretan.
 */
export default function BottomNav() {
  const [buka, setBuka] = useState(false);
  const pathname = usePathname?.() ?? "";
  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {buka && (
        <div
          role="dialog"
          aria-label="Menu semua"
          className="fixed inset-x-0 bottom-28 z-40 mx-auto max-w-md px-5 lg:hidden"
        >
          <div className="rounded-[1.75rem] border-2 border-ink bg-white p-2 shadow-doodle">
            {MENU_SEMUA.map((it) => (
              <a
                key={it.href}
                href={it.href}
                onClick={() => setBuka(false)}
                className="flex min-h-12 items-center rounded-2xl px-4 text-sm font-medium text-ink hover:bg-cream active:bg-cream"
              >
                {it.label}
              </a>
            ))}
            <button
              onClick={() => setBuka(false)}
              className="mt-1 flex min-h-12 w-full items-center rounded-2xl px-4 text-sm text-muted hover:bg-cream"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-[1.75rem_2rem_1.75rem_2rem] border-2 border-ink bg-white/95 shadow-doodle backdrop-blur lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-1.5 py-1.5">
          {ITEMS.slice(0, 2).map((it) => (
            <NavItem key={it.href} {...it} aktif={aktif(it.href)} />
          ))}

          <button
            aria-label="Tambah"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className="-my-2 flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-ink bg-terracotta text-3xl leading-none text-white shadow-doodle-sm transition-transform duration-150 hover:rotate-0 hover:scale-105 active:scale-95"
          >
            <span aria-hidden="true" className={buka ? "rotate-45" : ""}>
              +
            </span>
          </button>

          {ITEMS.slice(2).map((it) => (
            <NavItem key={it.href} {...it} aktif={aktif(it.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavItem({
  href,
  label,
  ikon,
  aktif,
}: {
  href: string;
  label: string;
  ikon: string;
  aktif: boolean;
}) {
  return (
    <a
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[0.7rem] leading-tight transition-transform duration-150 active:scale-95 ${
        aktif ? "bg-ink font-semibold text-cream" : "text-muted"
      }`}
    >
      <DoodleIcon nama={ikon} className="h-6 w-6" />
      {label}
    </a>
  );
}
