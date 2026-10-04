/**
 * PageHeader — judul halaman + deskripsi singkat + slot aksi.
 * Memberi ritme editorial ala buku sketsa: garis tinta tebal di bawah judul
 * dan coretan kecil sebagai penanda tangan visual.
 */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h1>
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 w-12 rounded-full bg-terracotta"
        />
        {description ? (
          <p className="mt-2 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
