// tests/ui/dashboard.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "@/app/(main)/page";
import { HouseholdProvider } from "@/lib/household-context";

function stubFetch(map: Record<string, any>) {
  return vi.fn((url: any, init?: any) => {
    const u = String(url);
    if (init?.method === "POST" && u.includes("/api/households")) {
      const body = JSON.parse(init.body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "h9", nama: body.nama }) });
    }
    const key = Object.keys(map).find((k) => u.includes(k));
    const val = key ? map[key] : [];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(val) });
  });
}

test("tampilkan 1 hal urgent paling besar", () => {
  render(<Dashboard urgent={{ text: "Internet jatuh tempo besok" }} counts={{ tugas: 3, belanja: 5 }} />);
  expect(screen.getByText(/jatuh tempo besok/i)).toBeInTheDocument();
});

test("tanpa rumah aktif: nama kosong tidak manggil API", async () => {
  const f = stubFetch({ "/api/households": [] });
  vi.stubGlobal("fetch", f);
  try {
    render(
      <HouseholdProvider initial={null}>
        <Dashboard />
      </HouseholdProvider>
    );
    expect(await screen.findByText(/bikin rumah pertamamu/i)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /buat rumah/i }));
    expect(await screen.findByText(/nama rumah wajib diisi/i)).not.toBeNull();
    expect(
      f.mock.calls.some((c: any[]) => String(c[0]).includes("/api/households") && (c[1] as any)?.method === "POST")
    ).toBe(false);
  } finally {
    vi.unstubAllGlobals();
  }
});

test("buat rumah: POST nama ter-trim lalu pindah ke rumah baru", async () => {
  const f = stubFetch({ "/api/households": [] });
  vi.stubGlobal("fetch", f);
  try {
    render(
      <HouseholdProvider initial={null}>
        <Dashboard />
      </HouseholdProvider>
    );
    fireEvent.change(await screen.findByLabelText(/nama rumah/i), { target: { value: "  Rumah Tebet  " } });
    fireEvent.click(screen.getByRole("button", { name: /buat rumah/i }));
    await waitFor(() => {
      const post = f.mock.calls.find(
        (c: any[]) => String(c[0]).includes("/api/households") && (c[1] as any)?.method === "POST"
      );
      expect(post).toBeTruthy();
      expect(JSON.parse((post as any[])[1].body)).toEqual({ nama: "Rumah Tebet" });
    });
    // Habis bikin rumah: householdId berubah → efek refetch jalan dengan rumah baru.
    await waitFor(() => {
      expect(f.mock.calls.some((c: any[]) => String(c[0]).includes("household_id=h9"))).toBe(true);
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

test("switcher pindah rumah saat punya ≥1 rumah", async () => {
  const rows = [
    { role: "admin", households: { id: "h1", nama: "Rumah A" } },
    { role: "member", households: { id: "h2", nama: "Rumah B" } },
  ];
  const f = stubFetch({ "/api/households": rows });
  vi.stubGlobal("fetch", f);
  try {
    render(
      <HouseholdProvider initial={{ id: "h1", nama: "Rumah A", role: "admin" }}>
        <Dashboard />
      </HouseholdProvider>
    );
    const sel = (await screen.findByLabelText(/pindah rumah/i)) as HTMLSelectElement;
    expect(sel.value).toBe("h1");
    fireEvent.change(sel, { target: { value: "h2" } });
    await waitFor(() => {
      expect(f.mock.calls.some((c: any[]) => String(c[0]).includes("household_id=h2"))).toBe(true);
    });
  } finally {
    vi.unstubAllGlobals();
  }
});
