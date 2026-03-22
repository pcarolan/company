/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Radiohead palette — warm parchment + muted reds
        parchment: {
          50: '#faf8f3',
          100: '#f5f0e8',
          200: '#ebe5d9',
          300: '#d4c9b5',
          400: '#c8bfa8',
          500: '#b0a48a',
          600: '#8a7d65',
          700: '#6b604c',
          800: '#4a4235',
          900: '#2a2a28',
        },
        blood: {
          DEFAULT: '#c0392b',
          light: '#d45a4f',
          dim: '#944a3f',
          dark: '#6b2119',
        },
      },
      fontFamily: {
        typewriter: ['"Special Elite"', '"Courier New"', 'monospace'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
