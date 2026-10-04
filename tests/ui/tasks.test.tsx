// tests/ui/tasks.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import TaskRow from "@/components/TaskRow";
import TugasPage from "@/app/(main)/tugas/page";
import { HouseholdProvider } from "@/lib/household-context";
test("geser kanan = selesai memanggil onToggle", () => {
  const fn = vi.fn();
  render(<TaskRow judul="Pel lantai" status="todo" onToggle={fn} />);
  fireEvent.click(screen.getByRole("checkbox"));
  expect(fn).toHaveBeenCalled();
});
test("milikku tanpa identitas tampilkan empty state khusus, bukan semua tugas", () => {
  const tugas = [
    { id: "1", judul: "Pel lantai t1", assignee_id: "orang-lain", status: "todo" },
    { id: "2", judul: "Cuci piring t2", assignee_id: "orang-lain-2", status: "todo" },
  ];
  render(<TugasPage tugasAwal={tugas} />);
  expect(screen.queryByText("Pel lantai t1")).toBeNull();
  expect(screen.queryByText("Cuci piring t2")).toBeNull();
  expect(screen.getByText(/belum bisa filter milikku/i)).not.toBeNull();
});
test("gagal muat tampilkan pesan error, bukan empty state", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  try {
    render(<HouseholdProvider initial={{ id: "h1" }}><TugasPage /></HouseholdProvider>);
    expect(await screen.findByText(/gagal memuat tugas/i)).not.toBeNull();
    expect(screen.queryByText(/belum ada tugas/i)).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});
