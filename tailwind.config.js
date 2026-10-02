/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          550: '#1a9e4a',
        },
        // Warmes Neutralgrau (Redesign 3.0) – ersetzt Tailwinds kühles Grau überall
        gray: {
          50:  '#F2F3F1',
          100: '#E9EBE8',
          200: '#DADDD9',
          300: '#C2C7C4',
          400: '#747C79',
          500: '#5E6664',
          600: '#4A5250',
          700: '#2C3331',
          800: '#1B201F',
          900: '#111514',
          950: '#0A0D0C',
        },
        // Statusfarben: bald (orange) / abgelaufen (rotbraun) – auch bei Farbschwäche unterscheidbar
        soon:    { DEFAULT: '#8A4B00', soft: '#FDF0DC', dark: '#F5C47A', 'dark-soft': '#45311A' },
        expired: { DEFAULT: '#A3330F', soft: '#FBE4DC', dark: '#F4A58A', 'dark-soft': '#4A2219' },
        // Markenfarbe (Petrol) — semantischer Name statt umgebogenem indigo
        primary: {
          50:  '#E8F4F4',
          100: '#C4E3E4',
          200: '#9DD0D2',
          300: '#6FBBBE',
          400: '#3DA3A7',
          500: '#0D7377',
          600: '#0A5C5F',
          700: '#084A4D',
          800: '#06393B',
          900: '#042829',
          950: '#021919',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'large-title': ['34px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title':       ['28px', { lineHeight: '34px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline':    ['20px', { lineHeight: '26px', fontWeight: '700' }],
        'body':        ['16px', { lineHeight: '22px' }],
        'callout':     ['15px', { lineHeight: '20px' }],
        'footnote':    ['13px', { lineHeight: '18px' }],
        'caption':     ['11px', { lineHeight: '13px', fontWeight: '600' }],
      },
      borderRadius: {
        'card': '16px',
        'tile': '18px',
      }
    },
  },
  plugins: [],
}
