# RUMI — Brand & Product Concept

> **Tagline:** Rumah yang lebih rapi, hidup lebih happy.  
> **Brand positioning:** Your friendly home manager.  
> **Product concept:** A simple, helpful digital home companion for modern families.

---

## 1. Brand Overview

**RUMI** adalah konsep SaaS manajemen rumah yang membantu keluarga mengatur aktivitas dan kebutuhan rumah tangga dalam satu tempat.

RUMI dirancang agar terasa seperti asisten digital yang ramah: mudah digunakan, tidak kaku, dan membantu keluarga mengurangi beban mengingat berbagai urusan rumah.

### Visi

Membantu keluarga modern menjalani kehidupan rumah yang lebih teratur, praktis, dan nyaman melalui teknologi yang mudah digunakan.

### Misi

- Menyatukan pengelolaan tugas, jadwal, belanja, dan tagihan rumah.
- Membantu keluarga mengingat hal penting melalui pengingat yang tepat waktu.
- Membuat pengelolaan rumah dapat dilakukan bersama oleh anggota keluarga.
- Menghadirkan pengalaman digital yang sederhana dan menyenangkan.

## 2. Target Audience

RUMI ditujukan untuk keluarga modern, termasuk:

- Pasangan muda yang mulai mengelola rumah bersama.
- Keluarga dengan anak yang membutuhkan koordinasi aktivitas.
- Individu atau pasangan yang tinggal mandiri.
- Anggota keluarga dengan tingkat literasi teknologi yang beragam.

**Prinsip desain:** mudah dipahami oleh pengguna baru, nyaman digunakan melalui ponsel, dan tetap berguna untuk seluruh anggota keluarga.

## 3. Brand Personality

| Karakter | Penerapan |
|---|---|
| Friendly | Bahasa sehari-hari yang hangat dan tidak menggurui |
| Helpful | Memberikan bantuan dan pengingat yang relevan |
| Simple | Fitur mudah ditemukan dan alur penggunaan ringkas |
| Cheerful | Sentuhan visual yang ceria tanpa terasa kekanak-kanakan |
| Reliable | Informasi rumah tangga tersaji dengan jelas dan konsisten |

### Gaya komunikasi

Gunakan bahasa Indonesia yang natural, singkat, dan suportif.

**Contoh:**

- “Tagihan internet jatuh tempo besok. Yuk, siapkan pembayarannya.”
- “Ada 3 tugas rumah yang perlu diselesaikan hari ini.”
- “Daftar belanja sudah siap. Tinggal cek sebelum ke toko.”

Hindari nada yang menyalahkan, terlalu formal, atau membuat pengguna merasa terbebani.

## 4. Visual Identity

### Palet warna

| Warna | Hex | Fungsi |
|---|---|---|
| Terracotta | `#D97757` | Warna utama dan aksen interaksi |
| Cream | `#F5EEE4` | Latar yang hangat |
| Charcoal | `#382F2A` | Teks utama |
| Muted Brown | `#786B60` | Teks sekunder |
| White | `#FFFFFF` | Permukaan kartu dan area konten |

Gunakan terracotta secara terukur untuk tombol utama, status penting, dan elemen identitas. Pastikan kontras teks memenuhi kebutuhan aksesibilitas.

### Tipografi

Rekomendasi awal:

- **Plus Jakarta Sans** untuk antarmuka utama.
- **Nunito** sebagai alternatif dengan karakter lebih rounded.

Gunakan hierarki tipografi yang jelas, ukuran teks yang nyaman di layar ponsel, dan hindari terlalu banyak variasi font.

### Konsep logo

Logo RUMI dapat menggunakan:

- Wordmark “rumi” dengan huruf kecil untuk kesan akrab.
- Simbol rumah minimalis.
- Elemen senyum, centang, atau bentuk sederhana yang menyiratkan bantuan dan keteraturan.

Logo sebaiknya tetap terbaca pada ukuran kecil, termasuk ikon aplikasi dan favicon.

## 5. Product Positioning

**RUMI adalah asisten digital yang membantu keluarga mengelola urusan rumah sehari-hari dalam satu aplikasi yang simpel dan ramah.**

Pembeda pengalaman yang ingin dibangun:

- Berorientasi pada kebutuhan keluarga, bukan administrasi yang rumit.
- Mengutamakan tindakan harian yang cepat.
- Menampilkan ringkasan hal penting dan pengingat.
- Mendukung penggunaan melalui PWA agar terasa seperti aplikasi mobile.

## 6. Core Features

Nama fitur berikut merupakan rancangan awal dan dapat disesuaikan setelah validasi kebutuhan pengguna.

| Fitur | Deskripsi | Prioritas MVP |
|---|---|---|
| Rumi Tasks | Membuat dan membagikan tugas rumah | Tinggi |
| Rumi Reminder | Pengingat tugas, jadwal, dan tagihan | Tinggi |
| Rumi Bills | Mencatat tagihan, nominal, dan tanggal jatuh tempo | Tinggi |
| Rumi Shopping | Daftar belanja bersama | Tinggi |
| Rumi Calendar | Jadwal dan agenda keluarga | Menengah |
| Rumi Family | Anggota keluarga dan pembagian akses | Tinggi |
| Rumi Dashboard | Ringkasan aktivitas dan hal yang perlu diperhatikan | Tinggi |
| Smart Home Integration | Integrasi perangkat dan automasi rumah | Pengembangan lanjutan |

### Prinsip reminder

Reminder merupakan bagian penting dari pengalaman RUMI.

- Pengguna dapat mengatur tanggal, waktu, dan pengulangan pengingat.
- Pengingat dapat ditujukan kepada anggota keluarga tertentu.
- Tampilkan status izin notifikasi dengan jelas.
- Sediakan alternatif di dalam aplikasi jika push notification tidak tersedia atau tidak diizinkan.
- Hindari notifikasi berlebihan; pengguna harus dapat mengatur preferensi.

**Catatan teknis:** dukungan Web Push dan perilaku notifikasi PWA berbeda menurut browser, sistem operasi, dan cara aplikasi dipasang. Uji pada perangkat target sebelum menjanjikan dukungan yang seragam.

## 7. Business Model

**Model awal:** one-time payment.

Hal yang perlu ditentukan melalui validasi:

- Apakah pembayaran berlaku per akun, rumah tangga, atau lisensi.
- Batas jumlah anggota keluarga.
- Apakah pembaruan fitur termasuk dalam pembelian awal.
- Biaya infrastruktur berulang, terutama jika memakai layanan push, sinkronisasi, atau penyimpanan cloud.
- Kemungkinan paket tambahan untuk fitur yang memiliki biaya operasional tinggi.

Model sekali bayar perlu dirancang dengan memperhitungkan biaya layanan jangka panjang agar produk tetap berkelanjutan.

## 8. Platform & UX Direction

**Platform:** Progressive Web App (PWA), dengan pendekatan mobile-first.

Prinsip UX:

1. Dashboard langsung menunjukkan hal yang perlu dilakukan.
2. Aksi utama dapat diselesaikan dalam sedikit langkah.
3. Navigasi menggunakan istilah yang familiar.
4. Tampilan responsif untuk ponsel, tablet, dan desktop.
5. Status tugas, tagihan, dan pengingat terlihat jelas.
6. Pengalaman tetap berguna ketika izin notifikasi tidak diberikan.

### Contoh navigasi utama

- Beranda
- Tugas
- Jadwal
- Belanja
- Keluarga
- Pengaturan

## 9. Example Dashboard Content

**Sapaan:** “Halo, keluarga!”

**Ringkasan:**

- Tugas rumah: 3 tugas tersisa.
- Tagihan: 1 segera jatuh tempo.
- Belanja: 5 barang dalam daftar.
- Jadwal: 2 agenda hari ini.

**Contoh pesan pengingat:**

> Tagihan internet jatuh tempo hari ini. Jangan lupa menyelesaikan pembayarannya.

Angka dan pesan di atas hanya contoh konten untuk mockup, bukan data produk aktual.

## 10. Brand Copy

### Short description

RUMI membantu keluarga mengatur tugas, jadwal, belanja, dan tagihan rumah dalam satu aplikasi yang simpel dan ramah.

### One-liner

Asisten digital untuk urusan rumah sehari-hari.

### Tagline alternatives

- Rumah yang lebih rapi, hidup lebih happy.
- Semua urusan rumah, lebih simpel.
- Biar urusan rumah nggak bikin ribet.
- Kelola rumah, nikmati waktunya.

**Tagline utama yang dipilih:** “Rumah yang lebih rapi, hidup lebih happy.”

## 11. MVP Roadmap

### Phase 1 — Core Home Management

- Akun dan pengaturan rumah tangga.
- Anggota keluarga dan pembagian akses dasar.
- Tugas rumah.
- Pencatatan tagihan.
- Daftar belanja.
- Dashboard ringkas.

### Phase 2 — Reminders & Collaboration

- Pengingat terjadwal.
- Pengulangan pengingat.
- Notifikasi push PWA pada platform yang didukung.
- Penugasan kepada anggota keluarga.
- Sinkronisasi perubahan dan status aktivitas.

### Phase 3 — Smart Home & Intelligence

- Eksplorasi integrasi smart home.
- Automasi berbasis jadwal atau kondisi.
- Ringkasan aktivitas berbantuan AI jika terbukti dibutuhkan.
- Integrasi layanan eksternal berdasarkan permintaan pengguna.

Fokus awal sebaiknya tetap pada pengelolaan rumah sehari-hari. Integrasi IoT dan AI dapat menjadi pengembangan setelah kebutuhan inti tervalidasi.

## 12. Validation Checklist

Sebelum identitas dan produk dikunci:

- [ ] Wawancara calon pengguna dari beberapa tipe keluarga.
- [ ] Uji apakah nama RUMI mudah diucapkan, diingat, dan diasosiasikan dengan produk.
- [ ] Periksa ketersediaan domain dan username media sosial.
- [ ] Lakukan penelusuran merek dagang sebelum penggunaan komersial.
- [ ] Uji prototipe dashboard dan alur membuat pengingat.
- [ ] Validasi kesediaan membayar dengan model one-time payment.
- [ ] Hitung biaya operasional dan dukungan jangka panjang.

**Status:** RUMI adalah konsep nama dan branding awal. Ketersediaan nama, domain, dan merek dagang belum diverifikasi.

---

*Dokumen ini dapat digunakan sebagai fondasi awal untuk product brief, desain UI/UX, dokumentasi proyek, atau konteks bagi coding agent.*
