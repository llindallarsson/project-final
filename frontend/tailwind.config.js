/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Vindra brand
        vindra: {
          50: "#eef7ff",
          100: "#d8ecff",
          200: "#b9dcff",
          300: "#8ec6ff",
          400: "#5aa7ff",
          500: "#2b86ff", // primär
          600: "#196af0",
          700: "#1556c4",
          800: "#1449a0",
          900: "#133f85",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "ui-sans-serif",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(16,24,40,0.08)",
      },
    },
  },
  plugins: [],
};
