# RUMI — Handoff (2026-10-04, updated)

## Status
MVP Phase 1 SELESAI di branch `rumi-mvp-phase-1` (10/10 tasks + build wave + pre-pilot wave, semua review bersih). Siap pilot keluarga. BELUM merge ke main.

## Keputusan locked (dari brainstorming)
- Scope C · Multi-rumah · Peran Admin/Anggota · Next.js PWA + Supabase · zero-cost
- Bayar ditunda · Reminder level 1 · UI: Dashboard C, Tugas B, Tagihan/Belanja B

## File
- `RUMI.md`, `docs/superpowers/specs/2026-10-03-rumi-design.md`
- `docs/superpowers/plans/2026-10-03-rumi-mvp-phase-1.md`
- Kode di branch `rumi-mvp-phase-1` (main hanya berisi docs): 15 test / 11 file hijau, `tsc` bersih, `next build` exit 0 (23/23 halaman)

## Rulings (ringkas — detail di git history, workspace SDD sudah dihapus)
- Scaffold via temp-dir (non-empty); 0002 own-read; 0003 creator-admin-insert; OAuth callback route; 0004 invites + serumah-read + service-role join; shopping-regex adaptasi diterima; Milikku-identity via /api/me (Task 9); build-green wave; 0005 RLS hardening + 6-item pre-pilot wave; hygiene batch (hooks/dates/404) deferred.

## SEBELUM PILOT — wajib (dari final review)
1. Link Supabase project → apply migrations 0001–0005 → `supabase db lint`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` server-only (untuk invite accept).
3. Uji manual 2–3 keluarga: register → buat rumah → invite/kode kedaluwarsa → CRUD tugas/tagihan/belanja/jadwal → curl lintas-rumah harus 403 → dashboard/reminder/.ics → mode pesawat → Add-to-Home-Screen Android + iOS.
4. Catat pemakaian free-tier.

## Diketahui ditunda (bukan defect)
Pengaturan page, profil/nama anggota, Keluarkan-anggota API, standalone-reminders API, push (Phase 2), payment, hygiene batch.
