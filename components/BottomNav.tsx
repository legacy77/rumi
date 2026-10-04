"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/tugas", label: "Tugas" },
  { href: "/pengingat", label: "Pengingat" },
  { href: "/belanja", label: "Belanja" },
  { href: "/keluarga", label: "Keluarga" },
];

/**
 * BottomNav — navigasi tetap di bawah untuk mobile (< lg).
 * Desktop memakai DesktopNav; keduanya berbagi gaya aktif yang sama.
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
          className="fixed inset-x-0 bottom-[4.5rem] z-40 mx-auto max-w-md px-4 lg:hidden"
        >
          <div className="rounded-2xl border border-line bg-white p-2 shadow-quiet">
            {[
              { href: "/tugas", label: "Tugas" },
              { href: "/belanja", label: "Belanja" },
              { href: "/tagihan", label: "Tagihan" },
              { href: "/jadwal", label: "Jadwal" },
              { href: "/pengingat", label: "Pengingat" },
            ].map((it) => (
              <a
                key={it.href}
                href={it.href}
                onClick={() => setBuka(false)}
                className="rumi-transition flex min-h-11 items-center rounded-lg px-3 text-sm text-ink hover:bg-cream"
              >
                {it.label}
              </a>
            ))}
            <button
              onClick={() => setBuka(false)}
              className="rumi-transition mt-1 flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-muted hover:bg-cream"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {ITEMS.slice(0, 2).map((it) => (
            <NavItem key={it.href} {...it} aktif={aktif(it.href)} />
          ))}

          <button
            aria-label="Tambah"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className="rumi-transition -mt-3 mb-1 flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full bg-primary text-2xl leading-none text-white shadow-quiet active:scale-95"
          >
            +
          </button>

          {ITEMS.slice(2).map((it) => (
            <NavItem key={it.href} {...it} aktif={aktif(it.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavItem({ href, label, aktif }: { href: string; label: string; aktif: boolean }) {
  return (
    <a
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`rumi-transition flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] ${
        aktif ? "font-semibold text-ink" : "text-muted"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${aktif ? "bg-primary" : "bg-transparent"}`}
      />
      {label}
    </a>
  );
}
