import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Guild palette */
        "guild-cream": "#F8F2E9",
        "guild-taupe": "#D7D1BD",
        "guild-peach": "#F6CA9E",
        "guild-mint": "#2D4A34",
        "guild-sky": "#ACE5FD",
        "guild-blush": "#ECBDFB",
        "guild-yellow": "#FDF18B",
        "off-black": "#170B01",
        /* Extended tokens */
        "primary-container": "#1A1A1A",
        "on-primary-container": "#E7651C",
        "primary-fixed": "#FFF0E6",
        "primary-fixed-dim": "#FFD0A8",
        "on-primary-fixed": "#1A1A1A",
        "secondary-container": "#D4E8D1",
        "on-secondary-container": "#1A3A1F",
        "secondary-fixed": "#E2F0DF",
        "secondary-fixed-dim": "#B8D4B2",
        "on-secondary-fixed": "#0A1F0E",
        "tertiary-fixed-dim": "#E89B3F",
        "on-tertiary-container": "#8B5E1A",
        "on-tertiary-fixed": "#2A1700",
        "on-tertiary-fixed-variant": "#653E00",
        "tertiary-container": "#2A1700",
        "error-container": "#FFDAD6",
        "on-error-container": "#93000A",
        "surface-container-low": "#F5F3EE",
        "outline-variant": "#D7D1BD",
        "inverse-surface": "#1A1A1A",
        "inverse-on-surface": "#F8F2E9",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        headline: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        "3": "3px",
      },
      boxShadow: {
        soft: "none",
      },
    },
  },
  plugins: [],
};
export default config;
