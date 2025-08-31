/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Brand palette used across the app
      colors: {
        brand: {
          primary: {
            DEFAULT: "#004e98",
            600: "#003f7a",
            700: "#002f5c",
          },
          secondary: {
            DEFAULT: "#3a6ea5",
            600: "#2f5885",
            700: "#234264",
          },
          accent: {
            DEFAULT: "#ff6700",
            600: "#cc5200",
            700: "#993d00",
          },
          surface: {
            50: "#fbfbfb",
            100: "#f7f7f7",
            200: "#f3f3f3",
            300: "#efefef",
            400: "#ebebeb", // main background shade
          },
          border: {
            DEFAULT: "#c0c0c0",
            200: "#d9d9d9",
            300: "#cccccc",
          },
        },
      },

      // Reusable UI shadows
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.08)",
        card: "0 8px 30px rgba(0,0,0,0.08)", // alias used by <Card />
      },

      // App UI font family
      fontFamily: {
        ui: ["Inter", "system-ui", "sans-serif"],
      },

      // Rounded corners scale
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
