export default function AttentionCard({ text, sisa }: any) {
  if (!text) return null;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink px-5 py-5 text-cream sm:px-6 sm:py-6">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-cream/70">
        Perlu perhatian
      </p>
      <h2 className="mt-2 max-w-xl text-lg font-semibold leading-snug tracking-tight sm:text-xl">
        {text}
      </h2>
      {sisa ? <p className="mt-2 text-xs text-cream/70">{sisa}</p> : null}
    </section>
  );
}
