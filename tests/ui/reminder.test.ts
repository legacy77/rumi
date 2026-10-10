// tests/ui/reminder.test.ts
import { expect, test } from "vitest";
import { toICS } from "@/lib/ics";
test("hasilkan file ics valid", () => {
  const s = toICS({ judul: "Rapat RT", mulai: "2026-10-04T19:00:00", selesai: "2026-10-04T20:00:00" });
  expect(s).toContain("BEGIN:VEVENT");
  expect(s).toContain("Rapat RT");
});
test("escape karakter khusus judul + UID unik per item", () => {
  const a = toICS({ judul: "Bayar listrik; PLN, blok A\nlantai 2", mulai: "2026-10-04T09:00:00", selesai: "2026-10-04T10:00:00", uid: "tagihan-1" });
  expect(a).toContain("SUMMARY:Bayar listrik\\; PLN\\, blok A\\nlantai 2");
  expect(a).toContain("UID:tagihan-1@rumi");
  expect(a).toContain("DTSTAMP:");
  const b = toICS({ judul: "x", mulai: "2026-10-04T09:00:00", selesai: "2026-10-04T10:00:00", uid: "jadwal-2" });
  expect(b).toContain("UID:jadwal-2@rumi");
  expect(b).not.toContain("UID:tagihan-1@rumi");
});
test("waktu lokal floating tanpa Z", () => {
  const s = toICS({ judul: "Rapat", mulai: "2026-10-04T09:00:00", selesai: "2026-10-04T10:00:00" });
  expect(s).toContain("DTSTART:20261004T090000");
  expect(s).toContain("DTEND:20261004T100000");
});
