import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HouseholdProvider } from "@/lib/household-context";
import KeluargaPage from "@/app/(main)/keluarga/page";

function renderAdmin(members: any[] = [{ user_id: "u2", nama: "Budi", role: "member" }]) {
  return render(
    <HouseholdProvider initial={{ id: "h1", role: "admin", userId: "admin1" }}>
      <KeluargaPage members={members} myRole="admin" />
    </HouseholdProvider>
  );
}

function renderSelf(members: any[] = [{ user_id: "admin1", nama: "Dhika", role: "admin" }]) {
  return render(
    <HouseholdProvider initial={{ id: "h1", role: "admin", userId: "admin1" }}>
      <KeluargaPage members={members} myRole="admin" />
    </HouseholdProvider>
  );
}

test("member tidak lihat tombol keluarkan", () => {
  render(<KeluargaPage members={[{ nama: "Ibu", role: "admin" }]} myRole="member" />);
  expect(screen.queryByText(/keluarkan/i)).toBeNull();
});

test("nama anggota tampil, bukan UUID", () => {
  renderAdmin([{ user_id: "u2", nama: "Budi Santoso", role: "member" }]);
  expect(screen.getByText("Budi Santoso")).not.toBeNull();
  expect(screen.queryByText("u2")).toBeNull();
});

test("admin klik Keluarkan -> DELETE /api/members + baris hilang", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  try {
    renderAdmin();
    fireEvent.click(screen.getByRole("button", { name: /keluarkan/i }));
    await waitFor(() => expect(screen.queryByText("Budi")).toBeNull());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/members",
      expect.objectContaining({ method: "DELETE" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ household_id: "h1", user_id: "u2" });
  } finally {
    vi.unstubAllGlobals();
    confirmSpy.mockRestore();
  }
});

test("admin ubah role anggota -> PATCH /api/members", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  try {
    renderAdmin([{ user_id: "u2", nama: "Budi", role: "member" }]);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "admin" } });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/members",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ household_id: "h1", user_id: "u2", role: "admin" }),
        })
      )
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

test("diri sendiri klik Keluar dari rumah -> POST /api/members", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
  try {
    renderSelf([{ user_id: "admin1", nama: "Dhika", role: "admin" }]);
    fireEvent.click(screen.getByRole("button", { name: /keluar dari rumah/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/members",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ household_id: "h1" }),
        })
      )
    );
  } finally {
    vi.unstubAllGlobals();
    confirmSpy.mockRestore();
  }
});

test("gagal keluarkan -> pesan error tampil, baris tetap", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Cuma admin yang bisa keluarkan anggota" }),
  });
  vi.stubGlobal("fetch", fetchMock);
  try {
    renderAdmin();
    fireEvent.click(screen.getByRole("button", { name: /keluarkan/i }));
    expect(await screen.findByText("Cuma admin yang bisa keluarkan anggota")).not.toBeNull();
    expect(screen.getByText("Budi")).not.toBeNull();
  } finally {
    vi.unstubAllGlobals();
    confirmSpy.mockRestore();
  }
});
