/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08080f",
        bg2: "#0d0d1a",
        bg3: "#11111f",
        blue: "#3b82f6",
        "blue-light": "#60a5fa",
        gray: "#94a3b8",
        gray2: "#475569",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.07)",
        blue: "rgba(59,130,246,0.2)",
      },
    },
  },
  plugins: [],
};
