// tests/ui/pengingat-kalender.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PengingatPage from "@/app/(main)/pengingat/page";
import { HouseholdProvider } from "@/lib/household-context";

const tugasHariIni = [
  { id: "t1", judul: "Pel lantai", status: "todo", deadline: "2026-10-10" },
];

function renderPage() {
  return render(
    <HouseholdProvider initial={{ id: "h1", userId: "u1" }}>
      <PengingatPage awal={{ tugas: tugasHariIni, tagihan: [], jadwal: [] }} />
    </HouseholdProvider>
  );
}

test("pakai share sheet bila Web Share file didukung", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  const canShare = vi.fn().mockReturnValue(true);
  vi.stubGlobal("navigator", { ...navigator, share, canShare });
  try {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /tambah ke kalender hp/i }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const arg = share.mock.calls[0][0];
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].name).toMatch(/\.ics$/);
  } finally {
    vi.unstubAllGlobals();
  }
});

test("fallback unduh bila Web Share tak didukung", async () => {
  vi.stubGlobal("navigator", { ...navigator, canShare: undefined, share: undefined });
  const createObjectURL = vi.fn().mockReturnValue("blob:x");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  const click = vi.fn();
  const origCreate = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
    const el = origCreate(tag);
    if (tag === "a") el.click = click;
    return el;
  });
  try {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /tambah ke kalender hp/i }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(click).toHaveBeenCalled();
  } finally {
    spy.mockRestore();
    vi.unstubAllGlobals();
  }
});
