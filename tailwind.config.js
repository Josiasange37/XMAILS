/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        card: "var(--bg-card)",
        "card-border": "var(--border)",
        muted: "var(--bg-alt)",
        "muted-foreground": "var(--text-secondary)",
        border: "var(--border)",
        primary: {
          DEFAULT: "#7c3aed",
          foreground: "#ffffff",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          DEFAULT: "var(--glow-purple)",
          purple: "#a78bfa",
          green: "#39d353",
          cyan: "#22d3ee",
          amber: "#f59e0b",
          indigo: "#818cf8",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        display: ["Georgia", "Times New Roman", "serif"],
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
