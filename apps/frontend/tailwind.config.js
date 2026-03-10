/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-teal-primary',
    'bg-teal-deep',
    'bg-teal-bright',
    'bg-teal-mist',
    'bg-ocean-deep',
    'bg-smoke',
    'text-teal-primary',
    'text-teal-deep',
    'text-slate',
    'text-ink',
    'border-teal-primary',
    'border-teal-mist',
    'hover:bg-teal-bright',
    'hover:bg-ocean-deep',
    'focus:ring-teal-primary',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from ASPG Brand Guide
        'teal-deep': '#0D2B2E',
        'teal-primary': '#1FA27D',
        'teal-bright': '#3ECFA8',
        'teal-mist': '#D4F5EC',
        'ocean-deep': '#0D7A8A',
        smoke: '#F4FAF9',
        slate: '#4A6B6F',
        ink: '#0D2B2E',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        brand: '4px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
}
