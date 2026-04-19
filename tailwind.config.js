/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy:       '#0f2044',
        'navy-light': '#1a3060',
        gold:       '#c9a84c',
        'gold-light': '#e8c97a',
        surface:    '#f8fafc',
        border:     '#e2e8f0',
        muted:      '#94a3b8',
        'state-submitted':  '#3b82f6',
        'state-progress':   '#f59e0b',
        'state-resolved':   '#22c55e',
        'state-closed':     '#6b7280',
        'state-rejected':   '#ef4444',
        'state-escalated':  '#f97316',
        'sla-green':  '#22c55e',
        'sla-amber':  '#f59e0b',
        'sla-red':    '#ef4444',
        'sla-grey':   '#94a3b8',
      },
    },
  },
  plugins: [],
};
