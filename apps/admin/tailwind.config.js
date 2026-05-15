/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blackBg: "#000000",
        gray900: "#121214",
        gray800: "#202024",
        gray700: "#2c2c2e",
        neonBlue: "#00ffff",
        neonGreen: "#00ff00",
      },
    },
  },
  plugins: [],
}