/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       '#0D1117',
        surface:       '#161B22',
        elevated:      '#21262D',
        accent:        '#F5A623',
        'accent-dim':  '#C97D15',
        'accent-soft': 'rgba(245,166,35,0.1)',
        muted:         '#8B949E',
        head:          '#E6EDF3',
        'body-text':   '#8D96A0',
        'border-warm': '#30363D',
        'border-hi':   '#484F58',
        'brand-glow':  'rgba(245,166,35,0.1)',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"Inter"', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'accent-glow': '0 4px 20px rgba(245,166,35,0.4), 0 1px 0 rgba(255,220,100,0.15) inset',
        'warm-sm':     '0 2px 8px rgba(0,0,0,0.5)',
        'warm-md':     '0 8px 32px rgba(0,0,0,0.6)',
        'card':        '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 20px rgba(0,0,0,0.5)',
        'card-hover':  '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
