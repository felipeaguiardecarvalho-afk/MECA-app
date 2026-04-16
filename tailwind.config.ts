/**
 * CRITICAL FILE — DO NOT MODIFY STRUCTURE
 * Breaking this file will destroy the UI
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0c1222",
          muted: "#5c6578",
        },
        accent: {
          DEFAULT: "#3730a3",
          soft: "#6366f1",
          glow: "#a5b4fc",
        },
        surface: {
          DEFAULT: "#fafafa",
          subtle: "#f4f4f5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(2.25rem,5vw,3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        display: ["clamp(1.75rem,3.5vw,2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        soft: "0 24px 48px -12px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 40px -8px rgba(55, 48, 163, 0.15)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
