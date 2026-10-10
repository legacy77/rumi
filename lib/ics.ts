// lib/ics.ts
// Generator .ics minimal untuk "Tambah ke Kalender HP".
// Escape per RFC 5545 §3.3.11: backslash, koma, titik-koma, newline.
function escapeICS(teks: string) {
  return String(teks ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Local datetime `YYYY-MM-DDTHH:mm:ss` -> `YYYYMMDDTHHmmss` (floating, tanpa Z)
// supaya jam yang dimaksud sama dengan jam lokal di HP user.
// String yang sudah ada Z / offset dihormati apa adanya.
function keFormatICS(waktu: string) {
  const s = String(waktu ?? "").trim();
  if (s === "") return "";
  const lokal = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (lokal) {
    const [, y, bl, tgl, j, mnt, dtk = "00"] = lokal;
    return `${y}${bl}${tgl}T${j}${mnt}${dtk}`;
  }
  return s.replace(/[-:]/g, "").split(".")[0];
}

function stampUTC(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function toICS({ judul, mulai, selesai, uid }: any) {
  const dtstart = keFormatICS(mulai);
  const dtend = keFormatICS(selesai);
  const id = uid ? `${String(uid).replace(/[^\w.-]/g, "")}@rumi` : `${Date.now()}@rumi`;
  const baris = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RUMI//Pengingat Rumah//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${id}`,
    `DTSTAMP:${stampUTC()}`,
    `SUMMARY:${escapeICS(judul)}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend || dtstart}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return baris.join("\r\n");
}
