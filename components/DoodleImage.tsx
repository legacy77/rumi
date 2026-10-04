// components/DoodleImage.tsx
/**
 * DoodleImage — ilustrasi hand-drawn dekoratif (lokal, public/doodle).
 * - Makna selalu disampaikan teks di sekitarnya (gambar aria-hidden).
 * - Skala kecil agar tidak mendominasi state mungil (h-24..h-36).
 */
export default function DoodleImage({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      draggable={false}
      className={`mx-auto h-24 w-auto select-none ${className}`}
    />
  );
}
