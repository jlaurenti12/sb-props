// tailwind.config.js
const {heroui} = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "confetti-fall": {
          "0%": { transform: "translateY(-60px) rotate(0deg)", opacity: "0.8" },
          "100%": { transform: "translateY(120px) rotate(360deg)", opacity: "0.25" },
        },
      },
      animation: {
        "confetti-fall": "confetti-fall 5s linear infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};