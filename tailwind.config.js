/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#003666", // Azul UCE
        secondary: "#D4AF37", // Dorado
        dark: "#0f172a",
      },
    },
  },
  plugins: [],
};
