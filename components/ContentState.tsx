import DoodleImage from "./DoodleImage";

/**
 * Gambar doodle per konteks halaman; dibatasi pada aset yang ada di
 * public/doodle agar tidak ada request 404.
 */
const GAMBAR: Record<string, string> = {
  tugas: "/doodle/santai.svg",
  tagihan: "/doodle/santai.svg",
  jadwal: "/doodle/santai.svg",
  pengingat: "/doodle/santai.svg",
  belanja: "/doodle/belanja.svg",
  keluarga: "/doodle/keluarga.svg",
  beranda: "/doodle/santai.svg",
};

export function EmptyState({
  title,
  detail,
  gambar,
}: {
  title: string;
  detail?: string;
  gambar?: string;
}) {
  const src = gambar ?? GAMBAR.beranda;
  return (
    <div className="rumi-card px-6 py-8 text-center">
      <DoodleImage src={src} />
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ text }: { text: string }) {
  return (
    <div role="alert" className="rounded-blob-sm border-2 border-ink bg-terracotta/[0.08] px-4 py-3 text-sm text-ink shadow-doodle-sm">
      {text}
    </div>
  );
}
