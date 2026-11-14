/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#002970',
          dark: '#001a47',
          light: '#00baf2',
          muted: '#e6f4fe',
          surface: '#f5f9ff'
        },
        ink: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#64748b',
          muted: '#94a3b8'
        },
        surface: {
          canvas: '#f8fafc',
          card: '#ffffff',
          subtle: '#f1f5f9',
          border: '#e2e8f0'
        },
        status: {
          positive: '#059669',
          positiveBg: '#ecfdf5',
          positiveBorder: '#a7f3d0',
          warning: '#b45309',
          warningBg: '#fffbeb',
          warningBorder: '#fde68a',
          critical: '#b91c1c',
          criticalBg: '#fef2f2',
          criticalBorder: '#fecaca',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Syne"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      height: {
        mobile: '44rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        elevated: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)',
        modal: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
        brutal: '4px 4px 0px #002970',
        'brutal-lg': '6px 6px 0px #002970',
        'brutal-cyan': '4px 4px 0px #00baf2',
        'brutal-dark': '4px 4px 0px #0f172a',
      }
    },
  },
  plugins: [],
}
