import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rumi: {
          primary: "#D97757",
          cream: "#F5EEE4",
          ink: "#382F2A",
          muted: "#786B60",
        },
        // Alias datar untuk pemakaian harian di komponen.
        terracotta: "#D97757",
        cream: "#F5EEE4",
        paper: "#F5EEE4",
        ink: "#382F2A",
        muted: "#786B60",
        // Nuansa kertas hangat untuk panel & ilustrasi doodle.
        clay: "#EFE3D5",
        sand: "#E6CBB2",
        // Hairline: garis tipis hangat untuk pemisah & border permukaan.
        line: "rgba(56, 47, 42, 0.12)",
        hairline: "rgba(56, 47, 42, 0.08)",
        surface: "#FBF7F1",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderWidth: {
        3: "3px",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        // Sudut besar tak seragam ala coretan tangan.
        blob: "1.6rem",
        "blob-sm": "1.05rem",
      },
      boxShadow: {
        quiet: "0 1px 2px rgba(56, 47, 42, 0.04)",
        // Bayangan offset keras (stiker) — ciri khas tema doodle.
        doodle: "4px 4px 0 0 #382F2A",
        "doodle-sm": "3px 3px 0 0 #382F2A",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
