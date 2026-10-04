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

## Koneksi Supabase (project baru 2026-10-04)
- Project: `orucqwwgygevqctuqfjs` (project lama `rosdradeohdbtsjlydbc` ditinggalkan — PostgREST-nya macet total/PGRST205 semua tabel, tiket support alternatif).
- Diterapkan: migrasi 0001–0005 + `drop_recursive_memberships_policy` + `rumi_perf_indexes`; 8 tabel RLS on; PostgREST 200 (anon empty, benar).
- Advisors: 1 WARN `rls_auto_enable()` SECURITY DEFINER milik fitur automatic-RLS Supabase — dibiarkan (bukan kode kita).
- Wajib di project BARU: `SUPABASE_SERVICE_ROLE_KEY` baru → `.env.local` + hosting; Google provider: callback URL baru `https://orucqwwgygevqctuqfjs.supabase.co/auth/v1/callback` di Google Console + enable di dashboard + Site/redirect URL (localhost + produksi).
1. ~~Link Supabase project → apply migrations 0001–0005~~ SELESAI 2026-10-04: 0001–0005 + index (`rumi_perf_indexes`, 7 index) teraplikasi di `rosdradeohdbtsjlydbc`; 8 tabel RLS aktif; advisors: 2 WARN pra-eksis milik app travel (`get_trip_by_invite` SECURITY DEFINER — bukan RUMI, jangan disentuh) + leaked-password-protection disarankan aktif via dashboard.
2. `.env.local` terisi (gitignored, aman). Masih butuh: `SUPABASE_SERVICE_ROLE_KEY` (server-only, untuk invite accept) + aktifkan Google provider di dashboard Auth (untuk login Google).
3. Uji manual 2–3 keluarga: register → buat rumah → invite/kode kedaluwarsa → CRUD tugas/tagihan/belanja/jadwal → curl lintas-rumah harus 403 → dashboard/reminder/.ics → mode pesawat → Add-to-Home-Screen Android + iOS.
   Smoke lokal 2026-10-04: /login 200, /offline 200, /pengingat 200, /api/me 401, /api/tasks 401 (guard auth OK). Temuan diperbaiki: kode baca ANON_KEY — alias ditambah di .env.local (nilai sama dengan publishable key).
   Follow-up nav 2026-10-04 (review Approved): `app/(main)/layout.tsx` mount provider + BottomNav global; dashboard buat-rumah + pindah-rumah; 401→/login. Lubang integrasi (provider tak ter-mount, nav hanya dashboard, tanpa UI buat-rumah) tertutup.
   Bug live 2026-10-04 (review Approved): policy "anggota baca serumah" rekursi tak-berhingga → semua baca memberships 500. Migrasi 0006 drop policy (live terbukti via probe); `app/api/members` pindah ke service-role dengan gate user. Satu minor deferred: gate error → 403 (fail-closed, konsisten).
   Bug live 2026-10-04 (review Approved): POST households 400 — baca-balik `.select()` ditolak SELECT-RLS (creator belum member). Urutan jadi: id client-side → insert → membership → select.
   Bug live 2026-10-04 (review Approved, terbukti live end-to-end): membership insert 42501 — nested-RLS (cek policy baca households yang tak terlihat pra-member). Bootstrap membership via service-role dengan verifikasi created_by.
   Pilot live 2026-10-04: rumah pertama tercipta via app dan terverifikasi di DB (admin, active). Alur buat-rumah closed-loop.
   Bug live 2026-10-04 (review Approved): Shift+F5 wajib — layout fetch sekali di mount (401 saat cookie belum sinkron) + SW cache-first JS basi. Fix: retry-once 401, force-dynamic /api/me+/api/households, refetch provider, SW bump rumi-v2 + network-first-fallback.
   Bug live 2026-10-04 (review Approved): /join 401 hanya teks tanpa aksi → user Incognito nyangkut; callback buang kode undangan. Fix: CTA login dengan next ter-encode, /login teruskan next ke emailRedirectTo+OAuth, callback safeNext (fail-closed /), test auth-callback-next.
   Bug live 2026-10-04 (review Approved): magic-link tak pernah login — token di URL fragment (#access_token) tak sampai ke server route. Fix: /auth/callback jadi client page (setSession hash + exchange ?code= client-side), safeNext di lib/auth-redirect.ts.
   Deploy prod 2026-10-04: Vercel `https://rumi-chi-tan.vercel.app` (repo GitHub legacy77/rumi, auto-deploy). Env Vercel diisi + Supabase Site/Redirect URL diarahkan ke domain prod. Verifikasi: /,/login,/auth/callback 200, /api/* 401 (benar).
   Nav UX 2026-10-04 (lane designer, committed): tab Pengingat di BottomNav, shortcut Pengingat/Keluarga di dashboard, tombol tambah tugas inline di /tugas, label offline "Kembali ke Beranda".
   Bug live 2026-10-04 (review Approved): Google login tampak gagal lalu refresh malah masuk — `createBrowserClient` set `detectSessionInUrl:true` (auto-exchange ?code=), callback lalu exchange kedua → kode terpakai → pesan palsu. Fix: session-first + re-check sesi saat error exchange (commit 57b2dd9, c58a2fa).
4. Catat pemakaian free-tier.

## Backlog (belum dikerjakan — bukan defect)
- **BL-1 · Uji join anggota kedua (blocked: butuh akun kedua).** Alur buat-rumah + undang + buka link undangan sudah lolos sampai halaman join, tetapi belum tervalidasi end-to-end sampai anggota benar-benar muncul di DB (`memberships` masih 1 anggota). Buka link undangan pakai akun Google/email LAIN di Incognito → verifikasi baris `role=member, status=active` + nama muncul di halaman Keluarga. Pemilik bisa pakai akun keluarga nyata saat pilot.
- **BL-2 · Rumah orphan (SELESAI 2026-10-04, disetujui user).** Dry-run: kedua target ("Rumah Metland" `6cdafa4a…`, `2fdb8313…`) 0 baris di memberships/tasks/bills/shopping_items/schedules/reminders/invites. DELETE guarded (NOT EXISTS semua tabel) menghapus tepat 2 baris (RETURNING cocok). Verifikasi: 1 household tersisa — `e848b12b…` "Rumah Metland", 1 anggota aktif. 0 orphan.
- **T-1 · Tambah tugas (SELESAI 2026-10-04, commit f7c4415).** Root cause terverifikasi bukti DB: 4 tugas existing semua `assignee_id=null, deadline=null` → tak terlihat di filter default `milikku` (butuh `assignee_id===userId`). Fix: `tambah()` kirim `assignee_id:userId` bila ada; tanpa userId tetap `null` (tak diblok). Regresi TDD merah→hijau (`tests/ui/tasks.test.tsx`, 35/35 lulus), tsc 0, build 22/22, push `origin/main`. Catatan non-bloker: race mount-time GET `[]` bisa menimpa insert optimis — di luar scope, tak disentuh.
- **D-1 · Audit permukaan tertunda (exp-3, 2026-10-04).** Missing: pengaturan page, profil/nama anggota (UI tampil `user_id` mentah), keluarkan-anggota API (`members` hanya GET), standalone-reminders API (tabel ada, CRUD tak ada), push, payment, hygiene hooks, free-tier dashboard. Partial: tombol `Keluarkan` tanpa `onClick` (`keluarga/page.tsx:98-100`), hygiene dates tersebar (tanpa `lib/date`), 404 hanya di API (tanpa `app/not-found.tsx`). Done: bayar tagihan (tandai lunas).

## Diketahui ditunda (bukan defect)
Pengaturan page, profil/nama anggota, Keluarkan-anggota API, standalone-reminders API, push (Phase 2), payment, hygiene batch.
