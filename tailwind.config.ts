import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4DB8A8",
          dark: "#3DA391",
        },
        secondary: {
          DEFAULT: "#E75B3F",
          dark: "#D94221",
        },
      },
    },
  },
  plugins: [],
};

export default config;