import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          dark: '#5B21B6',
          light: '#A78BFA',
        },
        surface: {
          DEFAULT: '#0F0F14',
          card: '#16161E',
          border: '#2A2A35',
        },
        green: { trade: '#22C55E' },
        red: { trade: '#EF4444' },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
