/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./dashboard/**/*.{js,ts,jsx,tsx}",
    "./scorecard/**/*.{js,ts,jsx,tsx}",
    "./planning/**/*.{js,ts,jsx,tsx}",
    "./programs/**/*.{js,ts,jsx,tsx}",
    "./program-builder/**/*.{js,ts,jsx,tsx}",
    "./coaching/**/*.{js,ts,jsx,tsx}",
    "./assessments/**/*.{js,ts,jsx,tsx}",
    "./people/**/*.{js,ts,jsx,tsx}",
    "./analytics/**/*.{js,ts,jsx,tsx}",
    "./settings/**/*.{js,ts,jsx,tsx}",
    "./agency/**/*.{js,ts,jsx,tsx}",
    "./notifications/**/*.{js,ts,jsx,tsx}",
    "./onboarding/**/*.{js,ts,jsx,tsx}",
    "./help/**/*.{js,ts,jsx,tsx}",
    "./search/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          accent: "hsl(var(--sidebar-accent))",
        },
      },
    },
  },
  plugins: [],
}
