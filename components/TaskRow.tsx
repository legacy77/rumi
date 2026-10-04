/**
 * TaskRow — satu baris tugas.
 * Checkbox tetap punya role "checkbox" (dipakai test) dan area ketuk ≥44px.
 * Aksi "ambil/assign" memakai aksen terracotta tipis, bukan tombol penuh.
 */
export default function TaskRow({ id, judul, assignee, status, onToggle, onAssign }: any) {
  const selesai = status === "done";
  return (
    <div
      data-task-id={id}
      className="group flex items-center justify-between gap-3 border-b border-hairline py-1 last:border-b-0"
    >
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={selesai}
          onChange={onToggle}
          className="h-5 w-5 shrink-0 accent-[#D97757]"
        />
        <span
          className={`text-sm leading-snug ${
            selesai ? "text-muted line-through" : "text-ink"
          }`}
        >
          {judul}
        </span>
      </label>
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
    </div>
  );
}
