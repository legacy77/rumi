export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-10 text-center">
      <div className="mx-auto mb-3 h-px w-8 bg-primary/70" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ text }: { text: string }) {
  return (
    <div role="alert" className="rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm text-ink">
      {text}
    </div>
  );
}
