import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="obsidian"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Mobile-first screen breakpoints matching real iPhone form factors
    screens: {
      sm: "375px", // iPhone SE / Mini
      md: "390px", // iPhone 13/14/15/16 standard
      lg: "414px", // iPhone Plus / XR
      xl: "430px", // iPhone Pro Max
      tablet: "768px",
      desktop: "1024px",
    },
    // Zero drop shadows per ADR-007 (border + background contrast only)
    boxShadow: {
      none: "none",
      sm: "none",
      DEFAULT: "none",
      md: "none",
      lg: "none",
      xl: "none",
      "2xl": "none",
      inner: "none",
    },
    extend: {
      colors: {
        cb: {
          canvas: "var(--cb-canvas)",
          surface: "var(--cb-surface)",
          "surface-elevated": "var(--cb-surface-elevated)",
          crimson: "var(--cb-crimson)",
          "crimson-hover": "var(--cb-crimson-hover)",
          "text-primary": "var(--cb-text-primary)",
          "text-secondary": "var(--cb-text-secondary)",
          "text-tertiary": "var(--cb-text-tertiary)",
          border: "var(--cb-border)",
          "border-subtle": "var(--cb-border-subtle)",
          "border-focus": "var(--cb-border-focus)",
          success: "var(--cb-success)",
          warning: "var(--cb-warning)",
          error: "var(--cb-error)",
          bg: "var(--cb-bg)",
          fg: "var(--cb-fg)",
          accent: "var(--cb-accent)",
          "accent-hover": "var(--cb-accent-hover)",
          danger: "var(--cb-danger)",
        },
      },
      spacing: {
        "cb-1": "var(--cb-space-1)", // 4px
        "cb-2": "var(--cb-space-2)", // 8px
        "cb-3": "var(--cb-space-3)", // 12px
        "cb-4": "var(--cb-space-4)", // 16px
        "cb-6": "var(--cb-space-6)", // 24px
        "cb-8": "var(--cb-space-8)", // 32px
        "cb-12": "var(--cb-space-12)", // 48px
        "cb-16": "var(--cb-space-16)", // 64px
        "cb-icon-xs": "var(--cb-icon-xs)", // 12px
        "cb-icon-sm": "var(--cb-icon-sm)", // 16px
        "cb-icon-md": "var(--cb-icon-md)", // 20px
        "cb-icon-lg": "var(--cb-icon-lg)", // 24px
        "cb-icon-xl": "var(--cb-icon-xl)", // 32px
        "cb-icon-2xl": "var(--cb-icon-2xl)", // 48px
        "cb-icon-hero": "var(--cb-icon-hero)", // 48px
      },
      borderRadius: {
        "cb-surface": "var(--cb-radius-surface)", // 14px
        "cb-pill": "var(--cb-radius-pill)", // 9999px
        "cb-inner": "var(--cb-radius-inner)", // 8px
      },
      fontFamily: {
        "cb-display": ["var(--cb-font-display)", "Georgia", "serif"],
        "cb-body": ["var(--cb-font-body)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "cb-mono": ["var(--cb-font-mono)", "monospace"],
      },
      fontSize: {
        "cb-display-xl": [
          "2.25rem",
          { lineHeight: "2.5rem", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "cb-display-l": [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "cb-h1": [
          "1.5rem",
          { lineHeight: "1.875rem", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "cb-h2": [
          "1.25rem",
          { lineHeight: "1.625rem", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "cb-h3": [
          "1.125rem",
          { lineHeight: "1.5rem", letterSpacing: "0", fontWeight: "500" },
        ],
        "cb-body-l": [
          "1.0625rem",
          { lineHeight: "1.5rem", letterSpacing: "0", fontWeight: "400" },
        ],
        "cb-body-m": [
          "1rem",
          { lineHeight: "1.375rem", letterSpacing: "0", fontWeight: "400" },
        ],
        "cb-body-s": [
          "0.9375rem",
          { lineHeight: "1.25rem", letterSpacing: "0", fontWeight: "400" },
        ],
        "cb-caption": [
          "0.8125rem",
          { lineHeight: "1.125rem", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        "cb-micro": [
          "0.6875rem",
          { lineHeight: "0.875rem", letterSpacing: "0.02em", fontWeight: "600" },
        ],
      },
      minHeight: {
        touch: "44px", // WCAG 2.5.5 minimum touch target
      },
      minWidth: {
        touch: "44px",
      },
      transitionDuration: {
        instant: "var(--cb-motion-instant)", // 80ms
        quick: "var(--cb-motion-quick)", // 150ms
        normal: "var(--cb-motion-normal)", // 220ms
        slow: "var(--cb-motion-slow)", // 320ms
        press: "var(--cb-motion-press)", // 80ms semantic alias
        tap: "var(--cb-motion-tap)", // 150ms semantic alias
        slide: "var(--cb-motion-slide)", // 220ms semantic alias
        modal: "var(--cb-motion-modal)", // 320ms semantic alias
      },
    },
  },
  plugins: [],
};

export default config;
