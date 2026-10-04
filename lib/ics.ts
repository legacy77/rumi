// lib/ics.ts
export function toICS({ judul, mulai, selesai }: any) {
  const f = (s: string) => s.replace(/[-:]/g, "").split(".")[0] + "Z";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${judul}`, `DTSTART:${f(mulai)}`, `DTEND:${f(selesai)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
