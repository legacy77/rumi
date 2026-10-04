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
