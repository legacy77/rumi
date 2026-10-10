# RUMI — Next Todo (dari gap Koabit)

> Status 10 Okt 2026: **T1–T4 selesai, migrasi ter-apply, sudah di-push.**
> Test 66/66 hijau, `tsc` bersih, `next build` sukses (incl. `/api/profile`).
> Migrasi `0006_tasks_recurrence.sql` + `0007_profiles.sql` **sudah di-apply**
> manual via Supabase SQL Editor (verified: kolom `pengulangan`/`induk_id` ada, tabel `profiles` ada).
> Commit `57f39dd` (fitur) + `fff3dee` (chore) sudah di-push ke `main`.
>
> **Tambahan (commit `e37ce36`, sudah live):** "Tambah ke Kalender HP" di
> `/pengingat` kini pakai Web Share sheet native untuk bagikan `.ics` (fallback
> unduh bila tak didukung). `lib/ics.ts` diperkuat: escape RFC 5545, `UID`
> unik, `DTSTAMP`, `PRODID`, waktu lokal floating. Test 70/70.
> Verified live di prod: chunk memuat `canShare`/`PRODID`/`DTSTAMP`.

Urutan: quick-win dulu, migrasi DB belakangan. Tanpa gamifikasi/AI/mood.

## T1 — Tasks edit + hapus [no migrasi]
- API: `PATCH /api/tasks` terima `judul, deskripsi, deadline, prioritas` (saat ini cuma `status, assignee_id`). Tambah `DELETE /api/tasks` (cek member aktif, scope `household_id`).
- GET: tambah `deskripsi, prioritas` ke select (saat ini cuma `id, judul, status, assignee_id, deadline`).
- UI `app/(main)/tugas/page.tsx` + `TaskRow.tsx`: dialog edit, tombol hapus confirm, tampil deadline/prioritas.
- Done: edit judul/deskripsi/deadline/prioritas/assignee jalan, hapus jalan, test update.

## T2 — Tugas berulang [migrasi]
- Migrasi `0006`: `tasks.pengulangan text default 'sekali' check (sekali/harian/mingguan/bulanan)` + `tasks.induk_id uuid references tasks(id)`.
- Aturan: `done` pada tugas berulang → auto-create instance berikutnya (deadline+interval). Jangan cron dulu, pakai lazy-generate saat PATCH done.
- UI: dropdown pengulangan di form tambah/edit, badge di TaskRow.
- Done: buat harian → selesaikan → muncul besok. Tanpa duplikat.

## T3 — Anggota: nama + manajemen [migrasi]
- Masalah kini: `GET /api/members` return `nama=user_id` UUID (`app/api/members/route.ts:39`).
- Migrasi `0007`: `profiles(user_id pk, nama text, avatar_url text)`, RLS read sesama rumah, upsert saat login/join.
- API members: join nama via `profiles`, fallback email prefix. Tambah `PATCH role` (admin only) + `POST leave` (keluar sendiri, larang jika admin terakhir).
- UI `keluarga/page.tsx`: list nama (bukan UUID), ganti role, keluar rumah, kick tetap unassign tasks.
- Done: tidak ada UUID tampil, leave + ganti role jalan.

## T4 — Belanja: jumlah/catatan + riwayat/favorit [no migrasi]
- Kolom `jumlah, catatan` sudah ada di DB + API, UI abaikan. Tambah input + tampil di `belanja/page.tsx`.
- Riwayat: query `status=dibeli` + tombol "beli lagi" (re-insert `perlu`). Favorit: hitung frekuensi nama → seksi "Sering dibeli", satu klik tambah.
- Done: jumlah/catatan tersimpan + tampil, riwayat + favorit jalan tanpa tabel baru.

## T5 — Jadwal: pengulangan + impor ICS [migrasi]
- Migrasi `0008`: `schedules.pengulangan text default 'sekali' + schedules.rrule text` (simpan RRULE mentah, render expand 90 hari di client).
- PATCH: terima `pengulangan`. UI: dropdown + badge.
- Impor: tombol "Impor .ics" di `jadwal/page.tsx`, parse client-side (pakai lib `ical.js` / func kecil, jangan dep baru besar), POST bulk ke `/api/schedules`, tampil konflik.
- Done: buat mingguan muncul tiap minggu, impor file .ics masuk tanpa duplikat parah.

## T6 — Kalender bersama (view gabung)
- Depend: T3 (nama) + T5 (pengulangan). Tanpa tabel baru.
- View baru `app/(main)/kalender/page.tsx`: gabung `schedules + tasks(deadline) + bills(jatuh_tempo)` satu bulan/minggu, warna per tipe + filter per anggota.
- Reuse `lib/ics.ts` untuk ekspor per view. Realtime cukup refetch seperti dashboard kini (jangan granular dulu).
- Done: satu layar lihat semua agenda rumah, filter anggota jalan, ekspor .ics jalan.
- Skip: impor Google/Outlook live-sync, cek tabrakan otomatis. Add when user minta.

## Urutan eksekusi
T1 → T4 → T3 → T2 → T5 → T6. Alasan: T1+T4 tanpa migrasi, T3 buka kunci T6, recurrence (T2/T5) butuh desain bareng biar format `pengulangan` konsisten.
