import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],

  content: [
    "./src/pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/components/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/app/**/*.{ts,tsx,js,jsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {

      /* -------------------------
         COLOR DESIGN TOKENS
      ------------------------- */

      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* Chart Colors */

        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        /* Sidebar */

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",

          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",

          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",

          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      /* -------------------------
         TYPOGRAPHY SYSTEM
      ------------------------- */

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.75rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },

      /* -------------------------
         BORDER RADIUS
      ------------------------- */

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* -------------------------
         SHADOW SYSTEM
      ------------------------- */

      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.06)",
        dropdown: "0 10px 25px rgba(0,0,0,0.08)",
        modal: "0 20px 40px rgba(0,0,0,0.15)",
      },

      /* -------------------------
         SPACING TOKENS
      ------------------------- */

      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },

      /* -------------------------
         ENTERPRISE ANIMATIONS
      ------------------------- */

      keyframes: {

        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },

        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },

        scaleIn: {
          from: { transform: "scale(.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },

      },

      animation: {

        fade: "fadeIn 0.3s ease-in-out",
        slide: "slideUp 0.35s ease",
        scale: "scaleIn 0.2s ease",

      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),
  ],
}

export default config