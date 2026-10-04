// tests/ui/shopping.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BelanjaPage from "@/app/(main)/belanja/page";
test("centang massal menandai dibeli", () => {
  render(<BelanjaPage items={[{ nama: "Galon", status: "perlu" }]} />);
  fireEvent.click(screen.getByText(/tandai semua dibeli/i));
  expect(screen.getByText(/dibeli/i)).toBeInTheDocument();
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
