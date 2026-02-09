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
        // Cinematic color palette
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary palette - deep oceanic blues
        primary: {
          50: "#e6f4f8",
          100: "#b3dbe6",
          200: "#80c2d4",
          300: "#4da9c2",
          400: "#2696b5",
          500: "#0d7490",
          600: "#0a5c73",
          700: "#084456",
          800: "#052c39",
          900: "#03141c",
        },

        // Accent - warm amber/gold
        accent: {
          50: "#fdf8e8",
          100: "#faedc1",
          200: "#f6e199",
          300: "#f2d671",
          400: "#efcc4d",
          500: "#e8b923",
          600: "#c99b1b",
          700: "#a67d15",
          800: "#835f0f",
          900: "#604109",
        },

        // Neutral - sophisticated grays
        neutral: {
          50: "#f7f7f8",
          100: "#ebeced",
          200: "#d4d6d9",
          300: "#b8bcc1",
          400: "#9ca1a9",
          500: "#7f8691",
          600: "#656c77",
          700: "#4c525b",
          800: "#32373f",
          900: "#191c23",
          950: "#0d0f13",
        },

        // Semantic colors for place types
        historical: "#c9a227",
        nature: "#2d8659",
        city: "#5a7fb8",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },

      fontSize: {
        // Dramatic headings
        "display-xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],

        // Body text
        "body-lg": ["1.125rem", { lineHeight: "1.75" }],
        "body-md": ["1rem", { lineHeight: "1.75" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],

        // Teasers and labels
        teaser: ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },

      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "fade-in-down": "fadeInDown 0.8s ease-out forwards",
        "scale-in": "scaleIn 0.6s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(239, 204, 77, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(239, 204, 77, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      backdropBlur: {
        xs: "2px",
      },

      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1200": "1200ms",
      },

      transitionTimingFunction: {
        "cinematic": "cubic-bezier(0.22, 1, 0.36, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      boxShadow: {
        "glow-sm": "0 0 10px rgba(239, 204, 77, 0.2)",
        "glow-md": "0 0 20px rgba(239, 204, 77, 0.3)",
        "glow-lg": "0 0 40px rgba(239, 204, 77, 0.4)",
        "inner-dark": "inset 0 0 100px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
