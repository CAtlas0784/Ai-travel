import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",
        secondary: "#22C55E",
        ink: "#0B1115",
        mist: "#F7FAF8",
        river: "#2563EB",
        gold: "#D97706"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(13, 26, 20, 0.11)"
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;
