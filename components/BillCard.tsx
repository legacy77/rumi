// components/BillCard.tsx
export default function BillCard({ nama, nominal, jatuh_tempo, status, onPay }: any) {
  return (<div className="bg-white rounded-xl p-3 border-l-4 border-[#D97757]">
    <div>{nama} · Rp{nominal}{jatuh_tempo ? ` · ${jatuh_tempo}` : ""}</div>
    {status !== "lunas" && <button onClick={onPay} className="bg-[#D97757] text-white rounded-full px-3 py-1 mt-2">Tandai lunas</button>}</div>);
}
