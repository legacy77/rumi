import type { CSSProperties } from "react";

/**
 * Skeleton — blok pemuatan berbentuk tata letak ala sketsa.
 * Diredupkan lembut lewat opacity + denyut halus (aman untuk reduced-motion,
 * lihat app/globals.css). `silent` menyembunyikan dari pembaca layar agar
 * hanya satu status hidup yang diumumkan di level halaman.
 */
export function Skeleton({
  className = "",
  style,
  silent = true,
}: {
  className?: string;
  style?: CSSProperties;
  silent?: boolean;
}) {
  return (
    <div
      aria-hidden={silent || undefined}
      className={`animate-pulse rounded-blob-sm bg-ink/[0.09] ${className}`}
      style={style}
    />
  );
}

/** Baris teks skeleton dengan lebar bervariasi. */
export function SkeletonLine({
  w = "100%",
  className = "",
}: {
  w?: string;
  className?: string;
}) {
  return <Skeleton className={`h-3.5 ${className}`} style={{ width: w }} />;
}

/** Kartu skeleton bergaris tinta tipis, dipakai untuk daftar tugas/tagihan/agenda. */
export function SkeletonCard({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rumi-card-alt rounded-blob-sm border-2 border-ink/15 bg-white p-4 ${className}`}>
      {children ?? (
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine w="55%" />
            <SkeletonLine w="30%" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Kerangka daftar berulang untuk halaman yang memuat data. */
export function SkeletonList({
  count = 3,
  label,
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
