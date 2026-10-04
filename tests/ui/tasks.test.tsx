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
test("tugas baru langsung terlihat di tab Milikku", async () => {
  const posted: any[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: any, init?: any) => {
      if (init?.method === "POST") {
        const body = JSON.parse(init.body);
        posted.push(body);
        return {
          ok: true,
          json: async () => ({
            id: "n1",
            judul: body.judul,
            assignee_id: body.assignee_id ?? null,
            status: "todo",
          }),
        };
      }
      return { ok: true, json: async () => [] };
    })
  );
  try {
    render(
      <HouseholdProvider initial={{ id: "h1", userId: "u1" }}>
        <TugasPage tugasAwal={[]} />
      </HouseholdProvider>
    );
    await screen.findByText(/belum ada tugas/i);
    fireEvent.change(screen.getByLabelText(/judul tugas/i), { target: { value: "Sapu" } });
    fireEvent.click(screen.getByText(/tambah tugas/i));
    expect(await screen.findByText("Sapu")).not.toBeNull();
    expect(posted[0]).toMatchObject({ household_id: "h1", assignee_id: "u1" });
  } finally {
    vi.unstubAllGlobals();
  }
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
