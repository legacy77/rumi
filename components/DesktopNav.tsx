"use client";
import { usePathname } from "next/navigation";
import { useHousehold } from "@/lib/household-context";

const ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/tugas", label: "Tugas" },
  { href: "/tagihan", label: "Tagihan" },
  { href: "/belanja", label: "Belanja" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/pengingat", label: "Pengingat" },
  { href: "/keluarga", label: "Keluarga" },
];

/**
 * DesktopNav — sidebar kertas untuk layar lebar (≥ lg).
 * Sengaja berbeda dari BottomNav (mobile) agar tata letak desktop terasa
 * disengaja, bukan mobile yang ditarik melebar. Panel kertas, border tinta 2px,
 * tautan aktif berupa coretan terakota di tepi kiri.
 */
export default function DesktopNav() {
  const household = useHousehold();
  const nama = household?.nama;
  const role = household?.role;
  const pathname = usePathname?.() ?? "";
  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-10 rounded-blob border-2 border-ink bg-white p-4 shadow-doodle">
        <div className="flex items-center gap-2.5 px-1">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-cream"
          >
            R
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-ink">RUMI</p>
            <p className="truncate text-xs text-muted">{nama ?? "Urusan rumah"}</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama desktop" className="mt-6 flex flex-col gap-1">
          {ITEMS.map((it) => {
            const on = aktif(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={`rumi-transition relative flex min-h-11 items-center rounded-blob-sm px-3 text-sm ${
                  on
                    ? "bg-cream font-semibold text-ink"
                    : "text-muted hover:bg-cream/70 hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mr-2.5 h-2 w-2 shrink-0 rounded-full ${
                    on ? "bg-terracotta" : "bg-transparent"
                  }`}
                />
                {it.label}
              </a>
            );
          })}
        </nav>

        {role ? (
          <p className="mt-6 border-t-2 border-ink/15 px-1 pt-4 text-xs capitalize text-muted">
            Masuk sebagai {role}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
