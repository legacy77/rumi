import DoodleImage from "@/components/DoodleImage";

export default function Offline() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-12 text-ink">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          Tanpa koneksi
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight">
          Kamu lagi offline...
        </h1>
        <span aria-hidden="true" className="mt-2 block h-1 w-12 rounded-full bg-terracotta" />

        <div className="rumi-card mt-8 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-terracotta"
            />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
              Mode santai
            </span>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-ink">
            Tenang, data terakhir yang tersimpan masih bisa dilihat. Tulisan barumu
            kami antrekan dan bakal otomatis kesync pas online lagi.
          </p>

          <div aria-hidden="true" className="my-6 h-px w-full bg-hairline" />

          <p className="text-base leading-relaxed text-muted">
            Menunggu sync: perubahan offline tidak hilang saat reload.
          </p>

          <a
            href="/"
            className="rumi-transition mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-terracotta px-4 py-3 text-base font-semibold text-[#2A211C] hover:brightness-95 active:brightness-90"
          >
            Kembali ke Beranda
          </a>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted">
          Begitu koneksi balik, antreanmu dikirim sendiri.
        </p>
      </div>
    </main>
  );
}
