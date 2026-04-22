import type { Config } from "tailwindcss";

const config: Config = {
  /** Scan all source under `src/` so utilities are never missed (utils, future routes, etc.). */
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  /** Runtime health check + fallback UI rely on these utilities — keep them in the build. */
  safelist: [
    "hidden",
    "bg-black",
    "text-white",
    "p-10",
    "rounded-xl",
    "bg-red-500",
    "p-4",
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
        glow: "0 0 0 1px rgba(99, 102, 241, 0.08), 0 16px 48px -8px rgba(99, 102, 241, 0.2)",
        "glow-sm": "0 0 32px -4px rgba(59, 130, 246, 0.25)",
        premium: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 20px 40px -12px rgba(30, 58, 138, 0.12)",
        "premium-hover":
          "0 8px 12px -2px rgba(15, 23, 42, 0.08), 0 28px 56px -16px rgba(30, 58, 138, 0.18)",
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
