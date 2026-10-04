// tests/ui/bottom-nav.test.tsx — kontrak bottom nav mobile (doodle theme).
// Fokus: label selalu tampil, target ketuk >=48px, ikon dekoratif, menu "Tambah".
import { render, screen, fireEvent, within } from "@testing-library/react";
import BottomNav from "@/components/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

test("nav mobile punya 5 slot berlabel + target ketuk >=48px", () => {
  render(<BottomNav />);
  const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
  const labels = ["Beranda", "Tugas", "Pengingat", "Belanja", "Keluarga"];
  for (const label of labels) {
    const link = within(nav).getByRole("link", { name: label });
    expect(link).toBeInTheDocument();
    // Target ketuk minimal 48px (min-h-12 = 3rem) — kelas Tailwind diterapkan.
    expect(link.className).toMatch(/min-h-12/);
  }
  // Ikon doodle dekoratif tidak boleh dibacakan sebagai teks.
  expect(nav.querySelectorAll("svg[aria-hidden='true']").length).toBeGreaterThanOrEqual(5);
});

test("tombol Tambah membuka menu semua dan bisa ditutup", () => {
  render(<BottomNav />);
  fireEvent.click(screen.getByRole("button", { name: "Tambah" }));
  const dialog = screen.getByRole("dialog", { name: "Menu semua" });
  for (const href of ["/tugas", "/belanja", "/tagihan", "/jadwal"]) {
    expect(dialog.querySelector(`a[href="${href}"]`)).not.toBeNull();
  }
  fireEvent.click(within(dialog).getByRole("button", { name: /tutup/i }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
