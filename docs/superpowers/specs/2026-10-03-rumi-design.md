# RUMI — Design Spec (MVP Phase 1)

Tanggal: 2026-10-03
Status: Draft — menunggu review user
Sumber: RUMI.md + hasil brainstorming (scope C, multi-rumah, Admin/Anggota, stack bebas, bayar ditunda, zero-cost dev, reminder level 1)

## 1. Pemahaman yang disepakati

- **Outcome:** mematangkan konsep RUMI menjadi spec siap-bangun untuk MVP Phase 1, dengan peta Phase 2-3.
- **Produk:** PWA mobile-first "asisten rumah" — tugas, tagihan, belanja, jadwal, dashboard ringkas, kolaborasi keluarga.
- **Brand:** friendly/helpful/simple/cheerful/reliable, bahasa Indonesia natural, palet terracotta `#D97757` / cream `#F5EEE4` / charcoal `#382F2A` / muted `#786B60` / white.
- **Keputusan locked:**
  - Scope C: petakan Phase 1-3, detailkan Phase 1.
  - 1 user bisa buat/gabung banyak rumah (multi-household).
  - Peran MVP: Admin vs Anggota saja.
  - Stack: rekomendasi tercepat-termurah (Pendekatan 1).
  - Monetisasi: ditunda, MVP gratis.
  - Constraint: Phase 1 development zero-cost.
  - Reminder: level 1 saja (in-app + tambah ke kalender device, tanpa Web Push di Phase 1).

## 2. Arsitektur (Pendekatan 1)

- **Frontend:** Next.js App Router sebagai PWA monolith, mobile-first, installable (manifest + service worker, icon, offline shell dasar).
- **Backend:** Supabase — Auth (email/Google), Postgres + RLS, Realtime, Storage (foto profil / bukti bayar), Edge Function + scheduler free-tier hanya sebagai fondasi (tidak dipakai untuk push di Phase 1).
- **Hosting:** Vercel / Cloudflare Pages free-tier, domain gratis dulu (tanpa domain berbayar wajib).
- **Zero-cost guard:** tidak ada layanan push/SMS/payment berbayar; jika limit free-tier dekat, degrade (kurangi realtime agresif, batasi storage) bukan upgrade.

## 3. Model data + peran

Tabel inti (semua fitur scoped `household_id`):

- `households(id, nama, created_by)`
- `memberships(user_id, household_id, role: admin|member, status: active|invited|left)`
- `tasks(id, household_id, judul, deskripsi, deadline, prioritas, status: todo|done, assignee_id, created_by)`
- `bills(id, household_id, nama, nominal, jatuh_tempo, status: belum|lunas, bukti_url, created_by)`
- `shopping_items(id, household_id, nama, jumlah, catatan, status: perlu|dibeli, created_by)`
- `schedules(id, household_id, judul, mulai, selesai, lokasi, created_by)` — minimal di Phase 1 untuk feed dashboard/agenda hari ini
- `reminders(id, household_id, ref_tipe, ref_id, waktu, pengulangan: sekali|harian|mingguan|bulanan, target_user_id, aktif)` — dipakai in-app dulu

Aturan akses (RLS):
- Semua query wajib `household_id` dari rumah aktif + cek `memberships` aktif.
- Admin: CRUD rumah, invite/hapus anggota, ganti role, semua CRUD fitur.
- Member: CRUD fitur harian, tidak bisa hapus rumah / keluarkan orang / ganti role.
- Invite via link/kode tanpa email berbayar; kode bisa kedaluwarsa.

## 4. Breakdown fitur Phase 1 (detail)

1. **Akun + rumah tangga:** register/login, buat rumah, daftar rumah saya, ganti rumah aktif, edit nama rumah.
2. **Keluarga:** lihat anggota, invite via link/kode, terima/tolak, keluar rumah. Admin kelola anggota/role.
3. **Tugas:** CRUD + tugaskan ke 1 anggota + status todo/done + filter (milikku / hari ini / selesai) + realtime update.
4. **Tagihan:** CRUD (nama, nominal, jatuh tempo, status) + tandai lunas + list H-3 jatuh tempo + upload bukti opsional. Tanpa payment gateway.
5. **Belanja:** 1 list aktif per rumah di MVP; tambah/centang massal, status perlu/dibeli, hapus yang sudah dibeli.
6. **Jadwal (minimal):** CRUD agenda sederhana untuk feed "agenda hari ini" di dashboard.
7. **Dashboard ringkas:** sapaan + 4 kartu (tugas tersisa hari ini, tagihan H-3, belanja belum dibeli, agenda hari ini) + seksi "perlu perhatian". Semua kartu link ke halaman terkait.
8. **Reminder Center (level 1):** list hari ini + terlewat dari `reminders` + tugas/tagihan/jadwal; cek saat app dibuka; tombol "Tambah ke Kalender HP" (file `.ics` / link Google Calendar). Tanpa push di Phase 1.

UX: empty-state ramah, aksi utama ≤ 3 langkah, navigasi Beranda/Tugas/Jadwal/Belanja/Keluarga/Pengaturan, status jelas, tetap berguna tanpa izin notifikasi.

Non-goals Phase 1: Web Push, pengulangan push otomatis, smart home/IoT, ringkasan AI, payment/monetisasi, multi-list belanja kompleks, peran anak/viewer.

## 5. Reminder — batasan yang disepakati

- Level 1 saja: in-app + kalender device. Tidak menjanjikan alarm exact-time saat HP offline / app di-kill total.
- Fondasi disiapkan (kolom `push_subscription`, halaman status izin, preferensi jam tenang) tapi Web Push VAPID baru di Phase 2.
- Alasan: perilaku PWA beda per browser/OS (Android Chrome OK; iOS andal 16.4+ via Add to Home Screen).

## 6. Peta Phase 2-3

- **Phase 2:** Web Push VAPID gratis (Edge Function + scheduler free-tier), kalender keluarga penuh, penugasan + sinkronisasi status, preferensi anti-spam (maks/hari, jam tenang).
- **Phase 3:** eksplorasi smart home, automasi jadwal/kondisi, ringkasan AI jika terbukti dibutuhkan. Non-goal sampai Phase 1 tervalidasi.

## 7. Alur data

Ganti rumah aktif → query ulang semua list dengan `household_id` baru → subscribe Realtime channel per rumah → UI optimis (centang tugas/belanja langsung berubah) + rollback + toast jika gagal.

## 8. Error handling

- RLS-denied / bukan anggota: "Kamu tidak punya akses ke rumah ini" + arahkan pilih rumah.
- Offline: tampilkan cache terakhir, tulis diantre, tandai "menunggu sync".
- Invite kedaluwarsa / sudah dipakai: pesan jelas + minta kode baru ke admin.
- Upload gagal (limit storage): tolak dengan jelas, tawarkan tanpa bukti.

## 9. Testing + validasi

- Uji manual: Android Chrome + iOS Add-to-Home-Screen, daftar → buat rumah → invite → tugas → tagihan → belanja → dashboard → reminder center → tambah ke kalender.
- Cek limit free-tier Supabase/hosting, tanpa dependensi berbayar.
- Validasi konsep: prototipe dashboard + alur buat reminder diuji ke 2-3 keluarga; cek nama/domain/merek sebelum komersial (lihat RUMI.md §12).

## 10. Kriteria "matang"

Spec ini dianggap final jika: model multi-rumah + peran disetujui, breakdown §4 tidak bertambah tanpa diskusi, batasan reminder §5 diterima, dan zero-cost §2 dipatuhi.

## 11. Keputusan UI/UX (visual companion 2026-10-03)

- Dashboard: **C — Fokus "perlu perhatian"** (1 hal urgent besar + ringkasan sisanya, paling tenang).
- Halaman Tugas + navigasi: **B — List kompak + swipe** (geser kanan = selesai, geser kiri = tugaskan; bottom nav dengan tombol + di tengah).
- Prinsip: mobile-first, kartu! Bahasa Indonesia santai, palet terracotta/cream/charcoal tetap.
- Tagihan + Belanja: **B — Tombol besar per item** ("Tandai lunas" / checkbox besar; sengaja beda dari Tugas B demi kejelasan pengguna baru).
