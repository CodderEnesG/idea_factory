import type { Config } from "tailwindcss";

/** IdeaFact Dark — BRANDING.md §8 (Derin Gece + Sinyal Amberi) design system tokenları. */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0d1013",
        surface: "#16191d",
        elevated: "#1e2227",
        glow: "#2a2116",
        brand: { DEFAULT: "#c07a28", fg: "#0d1013" },
        ink: { DEFAULT: "#f5f4f0", secondary: "#c7c5bd", muted: "#8f8d86" },
        pursue: "#0ca30c",
        watch: "#fab219",
        kill: "#d03b3b",
      },
      borderColor: {
        hair: "rgba(245,244,240,0.08)",
        strong: "rgba(192,122,40,0.35)",
      },
      borderRadius: { card: "16px", btn: "12px" },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 120px 10px rgba(42,33,22,0.85)",
        brand: "0 0 24px 0 rgba(192,122,40,0.3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
