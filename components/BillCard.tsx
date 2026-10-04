// components/BillCard.tsx
/**
 * BillCard — ringkasan satu tagihan.
 * Garis aksen tipis di kiri (terracotta) untuk status belum lunas;
 * nominal ditonjolkan sebagai angka utama.
 */
export default function BillCard({ nama, nominal, jatuh_tempo, status, onPay }: any) {
  const lunas = status === "lunas";
  return (
    <div
      className={`rounded-blob-sm border-2 border-ink bg-white p-4 shadow-doodle-sm ${
        lunas ? "" : "border-l-4 border-l-terracotta"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-ink">{nama}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
          Rp{nominal}
        </p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {jatuh_tempo ? `Jatuh tempo ${jatuh_tempo}` : "Tanpa tenggat"}
        </p>
        {lunas ? (
          <span className="text-xs font-medium text-muted">Lunas</span>
        ) : (
          <button
            onClick={onPay}
            className="rumi-transition inline-flex min-h-11 items-center rounded-lg bg-terracotta px-4 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.97]"
          >
            Tandai lunas
          </button>
        )}
      </div>
    </div>
  );
}
