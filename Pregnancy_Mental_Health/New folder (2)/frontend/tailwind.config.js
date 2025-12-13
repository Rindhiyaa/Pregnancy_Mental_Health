/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Poppins", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        teal: {
          primary: "#14B8A6",
        },
        brand: {
          blue: "#3B82F6",
          teal: "#14B8A6",
          lavender: "#E9D5FF",
        },
      },
    },
  },
  plugins: [],
};


