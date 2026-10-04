"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function Gabung() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const [pesan, setPesan] = useState("Lagi ngecek kode undangan...");
  const router = useRouter();
  const loginHref = `/login?next=${encodeURIComponent('/join?code=' + code)}`;
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
        else if (res.status === 401) {
          setPesan("Belum login, login dulu ya");
          router.push(loginHref);
        } else setPesan(data.error ?? "Kode nggak ketemu, cek lagi link-nya ya");
      })
      .catch(() => setPesan("Jaringan bermasalah, coba lagi ya"));
  }, [code]);

  return (
    <div>
      <h1>Gabung Keluarga</h1>
      <p>{pesan}</p>
      {pesan === "Belum login, login dulu ya" && (
        <a href={loginHref} className="mt-3 inline-block rounded-xl bg-[#6C5CE7] px-4 py-3 text-white">
          Login dulu
        </a>
      )}
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
