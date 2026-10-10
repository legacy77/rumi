/**
 * TaskRow — satu baris tugas.
 * Checkbox tetap punya role "checkbox" (dipakai test) dan area ketuk ≥44px.
 * Aksi "ambil/assign" memakai aksen terracotta tipis, bukan tombol penuh.
 */
export default function TaskRow({
  id,
  judul,
  deskripsi,
  assignee,
  status,
  deadline,
  prioritas,
  pengulangan,
  onToggle,
  onAssign,
  onEdit,
  onDelete,
}: any) {
  const selesai = status === "done";
  const ulangLabel =
    pengulangan === "harian"
      ? "Harian"
      : pengulangan === "mingguan"
      ? "Mingguan"
      : pengulangan === "bulanan"
      ? "Bulanan"
      : "";
  const deadlineAda = deadline !== null && deadline !== undefined && deadline !== "";
  const prioritasLabel =
    prioritas === "penting"
      ? "Penting"
      : prioritas === "rendah"
      ? "Rendah"
      : prioritas === "normal"
      ? "Normal"
      : "";
  const priorityColor =
    prioritas === "penting" ? "text-rose-600" : prioritas === "rendah" ? "text-green-700" : "text-amber-700";

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit?.(id);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(id);
  }

  return (
    <div data-task-id={id} className="group flex flex-wrap items-center justify-between gap-2 border-b border-hairline py-1 last:border-b-0">
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={selesai}
          onChange={onToggle}
          className="h-5 w-5 shrink-0 accent-[#D97757]"
        />
        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm leading-snug ${
              selesai ? "text-muted line-through" : "text-ink"
            }`}
          >
            {judul}
          </span>
          {(deskripsi || deadlineAda || prioritasLabel || ulangLabel) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {deskripsi && <span className="text-muted">{deskripsi}</span>}
              {deadlineAda && <span className="text-muted">Batas: {deadline}</span>}
              {prioritasLabel && (
                <span className={`font-medium ${priorityColor}`}>{prioritasLabel}</span>
              )}
              {ulangLabel && (
                <span className="rounded-blob-sm border border-terracotta px-1.5 text-terracotta">
                  {ulangLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </label>
      <div className="flex shrink-0 items-center gap-2">
        {onAssign ? (
          <button
            type="button"
            onClick={onAssign}
            className="rumi-transition min-h-11 shrink-0 rounded-lg px-3 text-xs font-medium text-terracotta hover:bg-terracotta/10 active:scale-[0.97]"
          >
            {assignee ?? "Ambil"}
          </button>
        ) : (
          <span className="shrink-0 px-3 text-xs text-muted">{assignee}</span>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={handleEditClick}
            className="rumi-transition min-h-11 shrink-0 rounded-lg border-2 border-ink px-3 text-xs font-semibold text-ink hover:bg-cream"
          >
            Ubah
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="rumi-transition min-h-11 shrink-0 rounded-lg border-2 border-ink px-3 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
