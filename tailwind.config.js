import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "#fffadf",
              100: "#fff3b3",
              200: "#ffec86",
              300: "#ffe559",
              400: "#ffde2d",
              500: "#ffd700",
              600: "#d2b100",
              700: "#a68c00",
              800: "#796600",
              900: "#4d4100",
              foreground: "#000",
              DEFAULT: "#ffd700",
            },
            secondary: {
              50: "#dfe6ec",
              100: "#b3c2d1",
              200: "#869eb6",
              300: "#597a9c",
              400: "#2d5781",
              500: "#003366",
              600: "#002a54",
              700: "#002142",
              800: "#001830",
              900: "#000f1f",
              foreground: "#fff",
              DEFAULT: "#003366",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50: "#4d4100",
              100: "#796600",
              200: "#a68c00",
              300: "#d2b100",
              400: "#ffd700",
              500: "#ffde2d",
              600: "#ffe559",
              700: "#ffec86",
              800: "#fff3b3",
              900: "#fffadf",
              foreground: "#000",
              DEFAULT: "#ffd700",
            },
            secondary: {
              50: "#000f1f",
              100: "#001830",
              200: "#002142",
              300: "#002a54",
              400: "#003366",
              500: "#2d5781",
              600: "#597a9c",
              700: "#869eb6",
              800: "#b3c2d1",
              900: "#dfe6ec",
              foreground: "#fff",
              DEFAULT: "#003366",
            },
          },
        },
      },
    }),
  ],
};

module.exports = config;
