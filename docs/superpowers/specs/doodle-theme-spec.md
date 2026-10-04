# Spec — RUMI Doodle Theme (revisi desain)

Disetujui user. Status: disetujui untuk implementasi.

## Tujuan

Revisi desain RUMI agar terasa friendly dan menarik ala "doodle SaaS",
plus bottom nav mobile yang lebih mudah dipakai. Ini murni perubahan visual
— tidak ada perubahan API, alur data, atau perilaku yang diuji.

## Cakupan

Seluruh aplikasi: nav mobile + desktop, 7 halaman utama, auth (login),
join, offline, dan state kosong/loading/error.

## Prinsip arah

- Gaya: kertas krem hangat, garis tinta tebal (sketsa), sudut besar tidak
  seragam, aksen terakota secukupnya. Bukan gradien ungu, bukan grid kartu
  generik.
- Friendly: ilustrasi doodle di state kosong/offline, ikon coretan di nav.
- Aksesibel: kontras, focus-visible, target sentuh ≥48px, reduced-motion.

## Bottom nav mobile (prioritas)

- Dock mengambang di atas tepi bawah, radius besar, bayangan lembut,
  border garis tinta tipis.
- 5 slot: Beranda, Tugas, Pengingat, Belanja, Keluarga.
- Tiap slot: ikon doodle (SVG inline) + label selalu terlihat.
- Aktif: pil tinta + ikon terakota, jelas terbaca.
- Target ketuk ≥48×48px; aman dari notch (env safe-area).

## Aset

- Sumber: Open Doodles / ikon doodle berlisensi CC0 atau MIT.
- Karya Dribbble hanya referensi gaya, tidak diunduh.
- Aset disimpan lokal di `public/doodle/**`, dicatat di `public/doodle/LICENSES.md`.
- Ikon nav: SVG inline di komponen (tanpa dependensi baru).

## Kontrak yang HARUS terjaga

- `aria-label="Navigasi utama"` (nav mobile) dan
  `aria-label="Navigasi utama desktop"` (nav desktop).
- Tautan nav berlabel Beranda/Tugas/Tagihan/Belanja/Jadwal/Pengingat/Keluarga.
- Dialog "Menu semua" dengan `role="dialog"` memuat tautan Tugas/Belanja/Tagihan/Jadwal.
- Semua string UI (error/empty/status) dan role (checkbox/alert/status) tetap.
- Tidak ada dependensi baru.

## Verifikasi

- `npx.cmd vitest run` hijau (tanpa unhandled error).
- `npx.cmd tsc --noEmit` bersih.
- `npx.cmd next build` sukses.
- Cek visual 360px (dock tidak menutup konten; target ≥48px).
- Reduced motion aman.
