// tests/e2e/smoke.spec.ts
// Smoke statis dashboard (pengganti Playwright sementara):
// Playwright + browser tidak tersedia di env ini, jadi smoke ini
// berjalan di jsdom via vitest. Niat Playwright aslinya:
//   test("dashboard menampilkan kartu urgent", async ({ page }) => {
//     await page.goto("/");
//     await expect(page.getByText(/perlu perhatian/i)).toBeVisible();
//   });
// Jalankan itu manual via `npx playwright test` bila browser tersedia.
//
// Catatan integrasi: BottomNav + HouseholdProvider kini dipasang layout
// app/(main)/layout.tsx (bukan dasbor), jadi smoke merender pohon terintegrasi.
import { render, screen, fireEvent, within } from "@testing-library/react";
import Dashboard from "@/app/(main)/page";
import MainLayout from "@/app/(main)/layout";

test("smoke: dashboard menampilkan kartu urgent + bottom nav 5 slot", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: any) => {
      const u = String(url);
      if (u.includes("/api/me")) return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "u1" }) });
      if (u.includes("/api/households"))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ role: "admin", households: { id: "h1", nama: "Rumah A" } }]),
        });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    })
  );
  try {
    render(
      <MainLayout>
        <Dashboard urgent={{ text: "Internet jatuh tempo besok" }} counts={{ tugas: 3, belanja: 5 }} />
      </MainLayout>
    );
    expect(await screen.findByText(/jatuh tempo besok/i)).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: /navigasi utama/i });
    for (const nama of ["Beranda", "Tugas", "Belanja", "Keluarga"]) {
      expect(within(nav).getByRole("link", { name: nama })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: /tambah/i }));
    const dialog = screen.getByRole("dialog");
    for (const nama of ["Tugas", "Belanja", "Tagihan", "Jadwal"]) {
      const link = dialog.querySelector(`a[href="/${nama.toLowerCase()}"]`);
      expect(link?.textContent).toMatch(new RegExp(nama, "i"));
    }
  } finally {
    vi.unstubAllGlobals();
  }
});
