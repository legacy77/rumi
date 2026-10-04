// app/not-found.tsx
/**
 * Halaman 404 — server component tanpa logika.
 * Kartu kertas doodle + ilustrasi santai, lalu jalan pulang ke Beranda.
 */
import DoodleImage from "@/components/DoodleImage";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="rumi-card rumi-card-alt w-full max-w-md px-6 py-10 text-center">
        <DoodleImage src="/doodle/santai.svg" className="h-28" />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
          Ups, nyasar ya?
        </h1>
        <span
          aria-hidden="true"
          className="mx-auto mt-2 block h-1 w-12 rounded-full bg-terracotta"
        />

        <p className="mt-3 text-sm text-muted">
          Halaman yang kamu cari nggak ketemu.
        </p>

        <a
          href="/"
          className="rumi-transition mt-7 inline-flex min-h-11 items-center justify-center rounded-blob-sm border-2 border-ink bg-terracotta px-5 text-sm font-semibold text-white shadow-doodle-sm hover:opacity-90 active:scale-[0.97]"
        >
          Kembali ke Beranda
        </a>
      </div>
    </main>
  );
}
