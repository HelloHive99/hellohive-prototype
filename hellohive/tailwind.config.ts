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
        // Visual Design Playbook - Locked Color Tokens
        'plum-900': '#150F16',      // Main app canvas/background
        'plum-800': '#1E1520',      // Global sidebar, top navigation
        'plum-700': '#2C1F2F',      // Cards, panels, modals
        'bumble': '#F5C518',        // Primary CTA buttons, active nav states
        'amber-warn': '#D4820A',    // System warnings, pending states
        'alabaster': '#F5F0EB',     // Primary text, data values
        'slate-sec': '#4A4953',     // Secondary text, table headers, timestamps
        'success': '#2ECC71',       // Completed states
        'error': '#E74C3C',         // Critical alerts, overdue items
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
