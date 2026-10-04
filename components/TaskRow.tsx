export default function TaskRow({ id, judul, assignee, status, onToggle, onAssign }: any) {
  return (<div className="bg-white rounded-xl px-3 py-2 flex justify-between" data-task-id={id}>
    <label><input type="checkbox" checked={status === "done"} onChange={onToggle} /> {judul}</label>
    {onAssign
      ? <button type="button" className="text-[#D97757] text-sm" onClick={onAssign}>{assignee ?? "Ambil"}</button>
      : <span className="text-[#D97757] text-sm">{assignee}</span>}</div>);
}
