# RUMI — Riset Pasar & Rekomendasi Pricing

> Status: riset awal (2026). Angka harga pesaing dari materi publik mereka; verifikasi ulang sebelum dipakai untuk keputusan final.

---

## 1. Peta Pesaing

### Pesaing langsung di Indonesia

| Produk | Model | Harga | Catatan |
|---|---|---|---|
| **Koabit** | 100% gratis, tanpa iklan, tanpa langganan | Rp0 | Ancaman harga terbesar. Fitur luas: tugas+poin, anggaran, belanja, AI. Tapi tanpa monetisasi → pertanyaannya bukan "apa dia menang" tapi "berapa lama dia hidup". |
| **Seruma** | Lifetime promo (early access) → normal Rp60.000/bln | ~Rp60.000/bln | Paling dekat positioning-nya (keluarga, tagihan, jadwal, rumah, kendaraan). Sudah ada pengguna berbayar. |
| **Atur Rumah** | Freemium berjenjang | Rp49.000/bln (5 anggota) → tier lebih tinggi (10 anggota) | Fokus keuangan keluarga + AI. Trial 30 hari. |
| **Klanest** | Freemium | Gratis s/d 2 anggota → berbayar s/d 10 anggota | Native Flutter (Android dulu). Keuangan + reminder + dokumen. |
| **Sederor** | Freemium premium | — | Fokus tugas rumah + poin + hadiah anak. |
| **Domus / Flatastic / Urusan Rumah Tangga** | Freemium | — | Tracker tugas/belanja/pengeluaran; sebagian AI. |

### Pesaing global (pembanding kematangan)

- **Cozi Family Organizer** — pemain lama (2010), freemium + iklan, IAP. Patokan model jangka panjang.
- **FamilyWall, Picniic, OurHome** — family organizer klasik. Picniic pernah uji redesign free trial (laporan publik: +25% revenue per trial start).

**Kesimpulan peta:** kategori ini **sudah ramai, bukan lapangan kosong**. Tapi semua pemain bermain di "keuangan + tugas" yang generik. RUMI harus menang di **sudut yang belum diambil**, bukan menambah fitur.

---

## 2. Benchmark Harga Pasar ID (apa yang orang Indonesia sudah terbiasa bayar)

| Layanan | Harga keluarga | Per anggota (isi penuh) |
|---|---|---|
| Spotify Family | Rp94.900/bln | ~Rp15.800 |
| Apple Music Family | Rp99.000/bln | ~Rp16.500 |
| YouTube Premium Family | Rp139.000–179.000/bln | Rp23.000–29.800 |
| Netflix Premium | Rp186.000/bln | — |
| **Atur Rumah (app keluarga)** | **Rp49.000/bln** | — |
| **Seruma (app keluarga)** | **Rp60.000/bln** | — |

**Implikasi:** untuk aplikasi keluarga kategori "nice to have", **willingness to pay realistis = Rp29.000–59.000/bulan per rumah tangga**. Di bawah Rp25rb dianggap murah, di atas Rp60rb butuh pembenaran kuat (mis. fungsi finansial).

---

## 3. Benchmark Konversi (dari data RevenueCat / ChartMogul / Adapty 2025–2026)

| Metrik | Angka | Sumber |
|---|---|---|
| B2C freemium → paid, median | 2–5% | Banyak sumber |
| B2C freemium → paid, "bagus" | 5–8% | Adapty |
| **Household/team-level conversion** | **3–5x lebih tinggi dari per-individu** | SaasDash |
| Hard paywall download→paid | ~10–12% | RevenueCat |
| Freemium download→paid | ~2,1% | RevenueCat |
| Trial 7 hari vs 30 hari | 7 hari konversi 15–20% lebih tinggi | Bolder Apps |

**Dua pelajaran langsung untuk RUMI:**
1. **Konversi diukur per rumah tangga, bukan per user.** Satu orang berlangganan → seluruh rumah ikut. Ini 3–5x lebih baik daripada model per-user.
2. **Free tier harus tetap bikin produk berguna, tapi tidak boleh menyelesaikan masalah utama.** Kalau gratis sudah "cukup", konversi mati (efek yang persis mengancam Koabit).

---

## 4. Rekomendasi Model Bisnis

**SaaS freemium, harga per rumah tangga, dengan pembayaran lokal.**

### Kenapa per rumah, bukan per user
- Rumah tangga = unit nilai sesungguhnya. Charge per user = menghukum virality (istri/suami jadi beban biaya tambahan).
- Team-level conversion 3–5x lebih tinggi.
- Pesaing ID (Atur Rumah, Klanest) sudah pakai limit anggota → pembanding langsung.

### Desain Free vs Pro

**Free (1 rumah):**
- Sampai 3 anggota
- Tugas & daftar belanja tanpa batas
- Jadwal keluarga dasar
- Tagihan maksimal 5 aktif
- Reminder **in-app saja** (tanpa push)

**Pro (per rumah):**
- Anggota tanpa batas
- Tagihan tanpa batas
- **Push notification + reminder berulang** ← ini retensi inti, jangan digratiskan
- Ekspor kalender (.ics) & riwayat
- Prioritas support

### Harga

| Paket | Harga | Per rumah/bulan |
|---|---|---|
| **Pro bulanan** | **Rp29.000/bln** | Rp29.000 |
| **Pro tahunan** | **Rp249.000/thn** | ~Rp20.750 (hemat ~28%) |

- Position: **di bawah Seruma (Rp60rb)**, **di bawah Atur Rumah (Rp49rb)** → masuk sebagai "yang lebih murah dan lebih simpel".
- Pembayaran lokal wajib: **QRIS, GoPay, OVO, DANA, transfer bank**. Tanpa ini konversi konsumen ID jatuh.
- **Lifetime/founding promo** boleh sebagai taktik terbatas (Rp149.000–199.000 sekali bayar) untuk dapat kas awal + testimoni — **tapi jangan jadikan model utama.** Biaya infra jalan terus; Seruma terjebak di sini.

---

## 5. Posisi Diferensiasi (karena pasarnya ramai)

Jangan lawan Koabit di "fitur gratis". Menangkan di:

1. **Bahasa & nada** — bahasa Indonesia yang hangat, bukan terjemahan. Sudah jadi kekuatan brand RUMI.
2. **PWA tanpa install** — pesaing ID mayoritas native (harus download APK). PWA = buka link, langsung pakai. Magic link tanpa password sudah ada.
3. **Fokus "ingat tagihan + koordinasi rumah"** — bukan keuangan/AI yang sudah diperebutkan Atur Rumah & Klanest.
4. **Brand yang friendly (doodle)** — kategori ini penuh UI korporat. Ini celah nyata.

**Risiko utama:** Koabit gratis dengan fitur lengkap. Mitigasi: jangan ikut perang gratis; menangkan pengalaman & retensi. Kalau Koabit benar tanpa pendapatan, dia akan mati/pivot → penggunanya pindah ke pemain yang punya model bisnis sehat.

---

## 6. Ekonomi Sederhana (kasar, untuk sanity check)

- ARPU Pro: Rp29.000/bln ≈ US$1,8/bln
- Biaya infra (Supabase Pro $25/bln + Vercel + push) ≈ US$40–60/bln
- **Break-even infra: ~35–50 rumah berbayar**
- Dengan konversi 3% dan ARPU Rp29rb → butuh **~1.500 user gratis** untuk ~45 pelanggan.

**Konsekuensi:** jangan bakar uang di iklan berbayar dulu (CAC > ARPU). Andalkan konten organik TikTok/IG + SEO + referral.

---

## 7. Langkah Validasi Berikutnya

- [ ] Tunjukkan pricing page ke 20–30 keluarga, ukur niat bayar di Rp29rb vs Rp49rb.
- [ ] Ukur konversi nyata per **rumah tangga**, bukan per user.
- [ ] Hitung biaya per rumah aktif di Supabase (bukan estimasi).
- [ ] Uji pesan: "Rp29.000 sebulan, satu rumah tenang" vs "gratis selamanya" (posisi lawan Koabit).
- [ ] Tentukan kanal: TikTok/IG organik vs komunitas parenting.

---

## 8. Verdict

**SaaS per rumah tangga, freemium, Rp29.000/bln.** Bukan jual code — target user non-teknis, dan jual source code akan mengkanibalisasi produk sendiri. GitHub tetap dipakai sebagai kanal trust/SEO, bukan produk.

Model one-time/lifetime **hanya taktik akuisisi awal**, bukan fondasi — biaya operasional berjalan terus dan akan membunuh produk yang mengandalkan pembelian sekali.
