// tests/ui/reminder.test.ts
import { expect, test } from "vitest";
import { toICS } from "@/lib/ics";
test("hasilkan file ics valid", () => {
  const s = toICS({ judul: "Rapat RT", mulai: "2026-10-04T19:00:00", selesai: "2026-10-04T20:00:00" });
  expect(s).toContain("BEGIN:VEVENT");
  expect(s).toContain("Rapat RT");
});
