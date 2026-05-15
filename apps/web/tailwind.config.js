const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ...defaultTheme.colors, // mantém todas as cores padrão
        blackBg: "#000000",
        gray700: "#2c2c2e",
        gray800: "#202024",
        gray900: "#121214",
        neonBlue: "#00ffff",
        neonGreen: "#00ff00",
      },

      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },

      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.3)",
      },

      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },

      animation: {
        slideIn: "slideIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};