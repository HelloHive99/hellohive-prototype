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
        // DEPRECATED - Migrated to Tailwind neutral/gray scale (Feb 2026)
        // 'plum-900': '#150F16',  // → bg-neutral-950
        // 'plum-800': '#1E1520',  // → bg-neutral-900 or bg-gray-800
        // 'plum-700': '#2C1F2F',  // → bg-neutral-800 or bg-gray-700
        // 'alabaster': '#F5F0EB', // → text-white
        // 'slate-sec': '#4A4953', // → text-gray-400 or border-gray-700

        // Keep accent colors
        'bumble': '#F5C518',        // Primary CTA, focus rings
        'amber-warn': '#D4820A',    // Warnings
        'success': '#2ECC71',       // Success states
        'error': '#E74C3C',         // Error states
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
