import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUMI",
    short_name: "RUMI",
    description: "Asisten digital untuk urusan rumah sehari-hari.",
    start_url: "/",
    display: "standalone",
    lang: "id",
    background_color: "#F5EEE4",
    theme_color: "#D97757",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
