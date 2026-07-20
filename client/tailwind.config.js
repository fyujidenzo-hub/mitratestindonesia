/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shopee: {
          50: "#fff5f2",
          100: "#ffe8e0",
          200: "#ffcdbd",
          300: "#ffa68b",
          400: "#ff7352",
          500: "#ee4d2d",
          600: "#d93d20",
          700: "#b62f18",
          800: "#962a1a",
          900: "#7c291d"
        },
        ink: "#202124",
        canvas: "#f6f6f7"
      },
      boxShadow: {
        card: "0 10px 30px rgba(39, 27, 23, 0.08)",
        float: "0 18px 55px rgba(238, 77, 45, 0.24)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
