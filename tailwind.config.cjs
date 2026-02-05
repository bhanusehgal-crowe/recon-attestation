/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "crowe-amber-bright": "#FFD231",
        "crowe-amber-core": "#F5A800",
        "crowe-amber-dark": "#D7761D",
        "crowe-indigo-bright": "#003F9F",
        "crowe-indigo-core": "#002E62",
        "crowe-indigo-dark": "#011E41",
        "crowe-tint-900": "#333333",
        "crowe-tint-700": "#4F4F4F",
        "crowe-tint-500": "#828282",
        "crowe-tint-300": "#BDBDBD",
        "crowe-tint-100": "#E0E0E0",
      },
    },
  },
  plugins: [],
};
