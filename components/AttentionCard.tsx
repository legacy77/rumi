export default function AttentionCard({ text, sisa }: any) {
  if (!text) return null;
  return (
    <section className="bg-[#382F2A] text-[#F5EEE4] rounded-2xl p-5">
      <h2 className="text-sm opacity-80">Perlu perhatian</h2>
      <p className="text-xl font-bold mt-1">{text}</p>
      {sisa ? <p className="text-sm mt-2 opacity-80">{sisa}</p> : null}
    </section>
  );
}
