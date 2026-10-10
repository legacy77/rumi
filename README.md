# 🏠 RUMI — Rumah Rapi, Hati Tenang

> Siapa yang urusan rumahnya numpuk tapi nggak ada yang ngerjain? 🙋
> RUMI bikin satu rumah satu aplikasi: tugas, belanja, tagihan, jadwal, pengingat — rapi bareng, nggak ada drama "kirain kamu yang beli".

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase)](https://supabase.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-live-black?logo=vercel)](https://rumi-chi-tan.vercel.app)

🌐 **Coba langsung:** [rumi-chi-tan.vercel.app](https://rumi-chi-tan.vercel.app)

---

## ✨ Kenapa RUMI?

- 📋 **Tugas** — siapa kerjakan apa, hari ini. Ada filter "Milikku" biar fokus.
- 🛒 **Belanja** — daftar belanjaan rumah, tandai yang udah dibeli, hapus yang dibeli sekaligus.
- 💸 **Tagihan** — catat yang wajib dibayar, lunasi yang mendesak. Jatuh tempo H-3 langsung kelihatan.
- 📅 **Jadwal** — agenda rumah biar nggak tabrakan. Bisa ekspor ke kalender (.ics).
- 🔔 **Pengingat** — yang jatuh tempo hari ini dan yang kelewat, dikumpulin satu tempat. Item bisa dibagikan sebagai `.ics` lewat share sheet HP untuk ditambahkan ke kalender (atau diunduh bila browser tidak mendukung).
- 👨‍👩‍👧 **Keluarga** — satu rumah satu tim. Undang anggota lewat link, ganti-ganti rumah gampang.
- 🏠 **Beranda** — ringkasan harian: apa yang urgent, apa yang bisa santai.

## 💅 Dibikin dengan cinta (dan doodle)

- Tema **doodle yang friendly**: kertas krem hangat, garis tinta tebal, sudut kartu yang nggak kaku, ilustrasi gambar tangan di setiap halaman kosong.
- **Bottom nav mobile** yang gampang dijangkau jempol: ikon coretan + label jelas, tombol Tambah yang nempel di tengah.
- **PWA** — bisa di-install ke HP kayak aplikasi beneran, ada halaman offline yang tetap ramah pas sinyal hilang.
- Login **tanpa password**: magic link email atau Google. Aman, nggak perlu ngapalin apa-apa.

## 🛠️ Tech stack

| Buat apa | Pakai apa |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (token tema sendiri, tanpa UI kit berat) |
| Backend & DB | Supabase (Postgres + Auth, RLS per rumah) |
| Deploy | Vercel |
| Tes | Vitest + Testing Library |

Kenapa Supabase? Auth + database + row-level security dalam satu tempat — data satu rumah nggak bisa diintip rumah lain. 🔒

## 🚀 Jalanin di laptop kamu

```bash
# 1. Clone & install
git clone https://github.com/legacy77/rumi.git
cd rumi
npm install

# 2. Siapin Supabase (bikin project gratis di supabase.com),
#    lalu isi .env.local:
#    NEXT_PUBLIC_SUPABASE_URL=...
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#    SUPABASE_SERVICE_ROLE_KEY=...

# 3. Gas
npm run dev     # buka http://localhost:3000
npm test        # jalanin tes (vitest)
npm run build   # cek build produksi
```

> Butuh skema DB? Lihat folder `supabase/` — migrasi SQL ada di sana.

## 📁 Struktur folder (intinya aja)

```
app/            → halaman + API routes (per fitur: tugas, belanja, ...)
components/     → komponen UI bersama (nav, kartu, skeleton, doodle)
lib/            → Supabase client/server, konteks rumah, util
public/doodle/  → ilustrasi doodle (lisensi aman, lihat LICENSES.md)
tests/          → tes UI + API + e2e smoke
docs/           → catatan desain & rencana
```

Detail desain tema ada di [`docs/superpowers/specs/doodle-theme-spec.md`](docs/superpowers/specs/doodle-theme-spec.md).

## 🤝 Ikut berkontribusi

1. Fork repo ini, bikin branch dari `main`.
2. Bikin perubahan kecil yang jelas (satu PR = satu hal).
3. Pastiin `npm test` ijo dan `npm run build` sukses sebelum push.
4. Buka PR, ceritain "kenapa" perubahannya — bukan cuma "apa".

## 🎨 Kredit aset

Ilustrasi doodle dari [Open Doodles](https://www.opendoodles.com/) (bebas dipakai komersial/pribadi, tanpa atribusi wajib). Detail di [`public/doodle/LICENSES.md`](public/doodle/LICENSES.md).

---

<p align="center">Dibuat biar rumah lebih rapi dan hati lebih tenang. 🏡✨</p>
