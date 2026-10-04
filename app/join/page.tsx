"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Gabung() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const [pesan, setPesan] = useState("Lagi ngecek kode undangan...");

  useEffect(() => {
    if (!code) {
      setPesan("Kode undangan nggak ada. Minta link undangan ke admin keluargamu ya.");
      return;
    }
    fetch("/api/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setPesan(data.message ?? "Udah gabung! Selamat datang di rumah barumu");
        else if (res.status === 410) setPesan("Kode kedaluwarsa, minta kode baru ke admin");
        else setPesan(data.error ?? "Kode nggak ketemu, cek lagi link-nya ya");
      })
      .catch(() => setPesan("Jaringan bermasalah, coba lagi ya"));
  }, [code]);

  return (
    <div>
      <h1>Gabung Keluarga</h1>
      <p>{pesan}</p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<p>Lagi ngecek kode undangan...</p>}>
      <Gabung />
    </Suspense>
  );
}
