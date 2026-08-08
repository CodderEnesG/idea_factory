import type { Config } from "tailwindcss";

/** IdeaFact Dark — BRANDING.md §8 (Derin Gece + Sinyal Menekşesi) design system tokenları. */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0f",
        surface: "#151320",
        elevated: "#1c1929",
        glow: "#241b3a",
        brand: { DEFAULT: "#7c3aed", fg: "#ffffff" },
        brand2: "#d946ef",
        ink: { DEFAULT: "#f7f6fb", secondary: "#c7c3d9", muted: "#8a86a3" },
        pursue: "#0ca30c",
        watch: "#fab219",
        kill: "#d03b3b",
      },
      borderColor: {
        hair: "rgba(247,246,251,0.08)",
        strong: "rgba(124,58,237,0.4)",
      },
      borderRadius: { card: "16px", btn: "12px" },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 120px 10px rgba(124,58,237,0.25)",
        brand: "0 0 24px 0 rgba(124,58,237,0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
