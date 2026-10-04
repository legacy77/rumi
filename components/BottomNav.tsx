"use client";
import { useState } from "react";

export default function BottomNav() {
  const [buka, setBuka] = useState(false);
  return (
    <>
      {buka && (
        <div role="dialog" aria-label="Menu semua">
          <a href="/tugas">Tugas</a>
          <a href="/belanja">Belanja</a>
          <a href="/tagihan">Tagihan</a>
          <a href="/jadwal">Jadwal</a>
          <a href="/pengingat">Pengingat</a>
          <button onClick={() => setBuka(false)}>Tutup</button>
        </div>
      )}
      <nav aria-label="Navigasi utama">
        <a href="/">Beranda</a>
        <a href="/tugas">Tugas</a>
        <a href="/pengingat">Pengingat</a>
        <button aria-label="Tambah" onClick={() => setBuka((v) => !v)}>
          +
        </button>
        <a href="/belanja">Belanja</a>
        <a href="/keluarga">Keluarga</a>
      </nav>
    </>
  );
}
