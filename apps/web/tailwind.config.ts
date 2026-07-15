import type { Config } from "tailwindcss";

/** Idea Factory Dark — kilitli design system tokenları. */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B0A11",
        surface: "#151221",
        elevated: "#1E1A2E",
        glow: "#321E48",
        brand: { DEFAULT: "#65DCD5", fg: "#04211F" },
        steel: "#43637E",
        ink: { DEFAULT: "#D9FFF4", secondary: "#8CA6A2", muted: "#5E6E77" },
        pursue: "#3FD9A0",
        watch: "#E7B75A",
        kill: "#E5678A",
      },
      borderColor: {
        hair: "rgba(217,255,244,0.08)",
        strong: "rgba(101,220,213,0.25)",
      },
      borderRadius: { card: "16px", btn: "12px" },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 120px 10px rgba(50,30,72,0.85)",
        teal: "0 0 24px 0 rgba(101,220,213,0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
