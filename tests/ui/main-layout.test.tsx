// tests/ui/main-layout.test.tsx — 401 → /login, non-401 gagal → error + retry.
import { render, screen, waitFor } from "@testing-library/react";
import MainLayout from "@/app/(main)/layout";

const nav = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace } };
});

vi.mock("next/navigation", () => ({
  // Objek router stabil seperti useRouter() asli (referensi tidak ganti tiap render).
  useRouter: () => nav.router,
}));

beforeEach(() => {
  nav.replace.mockClear();
  vi.unstubAllGlobals();
});

test("401 belum login dialihkan ke /login, bukan error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: any) =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: "Belum login" }) })
    )
  );
  render(
    <MainLayout>
      <span>Anak</span>
    </MainLayout>
  );
  await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText(/gagal memuat rumahmu/i)).toBeNull();
  expect(screen.queryByText("Anak")).toBeNull();
});

test("gagal non-401 tetap tampilkan error + retry", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve([]) }))
  );
  render(
    <MainLayout>
      <span>Anak</span>
    </MainLayout>
  );
  expect(await screen.findByText(/gagal memuat rumahmu/i)).not.toBeNull();
  expect(screen.getByRole("button", { name: /coba lagi/i })).not.toBeNull();
  expect(nav.replace).not.toHaveBeenCalled();
});
