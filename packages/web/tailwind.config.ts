import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Direct color definitions for reliability
        background: '#FFFFFF',
        foreground: '#1F2937',

        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },

        primary: {
          DEFAULT: '#1F2937',
          foreground: '#FFFFFF',
        },

        // Accent (red) - white text on red for proper contrast
        accent: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },

        muted: {
          DEFAULT: '#ececf0',
          foreground: '#64748B',
        },

        sidebar: {
          DEFAULT: '#F9FAFB',
          foreground: '#1F2937',
        },

        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#DC2626',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
