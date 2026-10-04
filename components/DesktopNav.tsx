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
 * DesktopNav — sidebar tetap untuk layar lebar (≥ lg).
 * Sengaja berbeda dari BottomNav (mobile) agar tata letak desktop terasa
 * disengaja, bukan mobile yang ditarik melebar.
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
      <div className="sticky top-10">
        <div className="flex items-center gap-2.5 px-2">
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

        <nav aria-label="Navigasi utama desktop" className="mt-6 flex flex-col gap-0.5">
          {ITEMS.map((it) => {
            const on = aktif(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={`rumi-transition flex min-h-11 items-center rounded-lg px-3 text-sm ${
                  on
                    ? "bg-white font-semibold text-ink shadow-quiet"
                    : "text-muted hover:bg-white/70 hover:text-ink"
                }`}
              >
                {it.label}
              </a>
            );
          })}
        </nav>

        {role ? (
          <p className="mt-6 border-t border-line px-3 pt-4 text-xs capitalize text-muted">
            Masuk sebagai {role}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
