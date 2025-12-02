/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        'golden-xs': '10px',
        'golden-sm': '16px',
        'golden-md': '26px',
        'golden-lg': '42px',
        'golden-xl': '68px',
        'golden-2xl': '110px',
      },
      width: {
        'card-golden': '324px',
        'golden-container': '1296px',
      },
      height: {
        'card-hero-golden': '200px',
        'page-hero-golden': '400px',
      },
      maxWidth: {
        'golden': '1296px',
      },
      aspectRatio: {
        'golden': '1.618',
        'golden-portrait': '0.618',
      },
      fontSize: {
        'xs': ['10px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '26px' }],
        'lg': ['20px', { lineHeight: '32px' }],
        'xl': ['26px', { lineHeight: '42px' }],
        '2xl': ['32px', { lineHeight: '42px' }],
        '3xl': ['42px', { lineHeight: '52px' }],
        '4xl': ['52px', { lineHeight: '68px' }],
        '5xl': ['68px', { lineHeight: '80px' }],
      },
    },
  },
  plugins: [],
};
