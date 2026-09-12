import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#18181b",
        "surface-light": "#27272a",
        gold: {
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        neon: {
          green: "#22c55e",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 25px rgba(234, 179, 8, 0.22)",
        "gold-glow-lg": "0 0 35px rgba(234, 179, 8, 0.32)",
        "neon-green": "0 0 15px rgba(34, 197, 94, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
