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
        ink: "#382F2A",
        muted: "#786B60",
        // Hairline: garis tipis hangat untuk pemisah & border permukaan.
        line: "rgba(56, 47, 42, 0.12)",
        hairline: "rgba(56, 47, 42, 0.08)",
        surface: "#FBF7F1",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        quiet: "0 1px 2px rgba(56, 47, 42, 0.04)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
