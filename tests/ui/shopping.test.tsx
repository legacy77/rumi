// tests/ui/shopping.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BelanjaPage from "@/app/(main)/belanja/page";

test("centang massal menandai dibeli", () => {
  render(<BelanjaPage items={[{ nama: "Galon", status: "perlu" }]} />);
  fireEvent.click(screen.getByText(/tandai semua dibeli/i));
  expect(screen.getByText(/beres/i)).toBeInTheDocument();
});
test("centang massal mencentang checkbox item", () => {
  render(<BelanjaPage items={[{ nama: "Galon", status: "perlu" }]} />);
  const box = screen.getByRole("checkbox") as HTMLInputElement;
  expect(box.checked).toBe(false);
  fireEvent.click(screen.getByText(/tandai semua dibeli/i));
  expect(screen.getByRole("checkbox", { checked: true })).toBeInTheDocument();
});
test("hapus yang dibeli mengosongkan list", () => {
  render(<BelanjaPage items={[{ nama: "Galon", status: "dibeli" }]} />);
  fireEvent.click(screen.getByText(/hapus yang dibeli/i));
  expect(screen.queryByText("Galon")).toBeNull();
  expect(screen.getByText(/belum ada barang/i)).toBeInTheDocument();
});
test("gagal muat tampilkan pesan error, bukan empty state", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  try {
    const { HouseholdProvider } = await import("@/lib/household-context");
    render(
      <HouseholdProvider initial={{ id: "h1" }}>
        <BelanjaPage />
      </HouseholdProvider>
    );
    expect(await screen.findByText(/gagal memuat belanja/i)).not.toBeNull();
    expect(screen.queryByText(/belum ada barang/i)).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});

test("tambah kirim jumlah+catatan", async () => {
  const fetchMock = vi.fn();
  fetchMock.mockImplementation(async (url, { method, body }) => {
    if (method === "POST") {
      return { ok: true, json: async () => JSON.parse(body) };
    }
    return { ok: true, json: async () => [] };
  });
  vi.stubGlobal("fetch", fetchMock);
  try {
    const { HouseholdProvider } = await import("@/lib/household-context");
    render(
      <HouseholdProvider initial={{ id: "h1" }}>
        <BelanjaPage />
      </HouseholdProvider>
    );
    fireEvent.change(screen.getByLabelText("Nama barang"), { target: { value: "Teh" } });
    fireEvent.change(screen.getByLabelText("Jumlah"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Catatan"), { target: { value: "murah" } });
    fireEvent.click(screen.getByText("Tambah barang"));
    const post = fetchMock.mock.calls.find((c) => c[1]?.method === "POST");
    expect(post).toBeDefined();
    const body = JSON.parse(post![1].body);
    expect(body.jumlah).toBe("3");
    expect(body.catatan).toBe("murah");
    expect(await screen.findByText("Teh")).toBeInTheDocument();
    expect(screen.getByText(/× 3/)).toBeInTheDocument();
    expect(screen.getByText(/· murah/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nama barang")).toHaveValue("");
    expect(screen.getByLabelText("Jumlah")).toHaveValue("1");
    expect(screen.getByLabelText("Catatan")).toHaveValue("");
  } finally {
    vi.unstubAllGlobals();
  }
});
test("jumlah/catatan tampil di list", () => {
  render(<BelanjaPage items={[{ id: "1", nama: "Gula", jumlah: "5", catatan: "mahal", status: "perlu" }]} />);
  expect(screen.getByText("Gula")).toBeInTheDocument();
  expect(screen.getByText(/× 5/)).toBeInTheDocument();
  expect(screen.getByText(/· mahal/)).toBeInTheDocument();
});
test("beli-lagi POST status perlu", async () => {
  const fetchMock = vi.fn();
  fetchMock.mockImplementation(async (url, { method, body }) => {
    if (method === "POST") {
      const p = JSON.parse(body);
      return { ok: true, json: async () => ({ ...p, id: "2", jumlah: p.jumlah ?? "1", catatan: p.catatan ?? "" }) };
    }
    return { ok: true, json: async () => [] };
  });
  vi.stubGlobal("fetch", fetchMock);
  try {
    const { HouseholdProvider } = await import("@/lib/household-context");
    render(
      <HouseholdProvider initial={{ id: "h1" }}>
        <BelanjaPage items={[{ id: "1", nama: "Teh", jumlah: "2", catatan: "pagi", status: "dibeli" }]} />
      </HouseholdProvider>
    );
    fireEvent.click(screen.getByLabelText("Beli lagi Teh"));
    const post = fetchMock.mock.calls.find((c) => c[1]?.method === "POST");
    expect(post).toBeDefined();
    const body = JSON.parse(post![1].body);
    expect(body.status).toBe("perlu");
    expect(body.nama).toBe("Teh");
    expect(body.jumlah).toBe("2");
    expect(body.catatan).toBe("pagi");
    expect(await screen.findAllByText("× 2")).not.toHaveLength(0);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
test("favorit muncul utk nama duplikat", () => {
  render(<BelanjaPage items={[{ id: "1", nama: "Kopi", status: "dibeli" }, { id: "2", nama: "Kopi", status: "perlu" }]} />);
  expect(screen.getByText("Sering dibeli")).toBeInTheDocument();
  expect(screen.getByText("×2")).toBeInTheDocument();
  expect(screen.getByText("Tambah")).toBeInTheDocument();
});
