import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102033",
        mist: "#f4f7fb",
        line: "#d6deea",
        primary: "#0f766e",
        primarySoft: "#d7f1ef",
        accent: "#145da0",
        danger: "#c2410c",
        success: "#166534",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(16, 32, 51, 0.08)",
      },
      borderRadius: {
        shell: "28px",
      },
      fontFamily: {
        sans: ["Instrument Sans", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;