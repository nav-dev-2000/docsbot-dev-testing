const headlessuiPlugin = require('@headlessui/tailwindcss')
const formsPlugin = require('@tailwindcss/forms')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
    './node_modules/react-tailwindcss-datepicker/dist/index.esm.js',
  ],
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}', './node_modules/react-tailwindcss-datepicker/dist/index.esm.js'],
  theme: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.5rem' }],
      base: ['1rem', { lineHeight: '1.75rem' }],
      lg: ['1.125rem', { lineHeight: '2rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['2rem', { lineHeight: '2.5rem' }],
      '4xl': ['2.5rem', { lineHeight: '3.5rem' }],
      '5xl': ['3rem', { lineHeight: '3.5rem' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1.1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans:         ['Inter', 'Roboto', 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', 'Arial', 'sans-serif'],
        display:      ['Seravek', 'Gill Sans Nova', 'Ubuntu', 'Calibri', 'DejaVu Sans', 'source-sans-pro', 'sans-serif'],
        systemui:     ['system-ui', 'sans-serif'],
        transitional: ['Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', 'serif'],
        oldstyle:     ['Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', 'P052', 'serif'],
        humanist:     ['Seravek', 'Gill Sans Nova', 'Ubuntu', 'Calibri', 'DejaVu Sans', 'source-sans-pro', 'sans-serif'],
        geohumanist:  ['Avenir', 'Montserrat', 'Corbel', 'URW Gothic', 'source-sans-pro', 'sans-serif'],
        classhuman:   ['Optima', 'Candara', 'Noto Sans', 'source-sans-pro', 'sans-serif'],
        neogrote:     ['Inter', 'Roboto', 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', 'Arial', 'sans-serif'],
        monoslab:     ['Nimbus Mono PS', 'Courier New', 'monospace'],
        monocode:     ['ui-monospace', 'Cascadia Code', 'Source Code Pro', 'Menlo', 'Consolas', 'DejaVu Sans Mono', 'monospace'],
        industrial:   ['Bahnschrift', 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', 'sans-serif-condensed', 'sans-serif'],
        roundsans:    ['ui-rounded', 'Hiragino Maru Gothic ProN', 'Quicksand', 'Comfortaa', 'Manjari', 'Arial Rounded MT', 'Arial Rounded MT Bold', 'Calibri', 'source-sans-pro', 'sans-serif'],
        slabserif:    ['Rockwell', 'Rockwell Nova', 'Roboto Slab', 'DejaVu Serif', 'Sitka Small', 'serif'],
        antique:      ['Superclarendon', 'Bookman Old Style', 'URW Bookman', 'URW Bookman L', 'Georgia Pro', 'Georgia', 'serif'],
        didone:       ['Didot', 'Bodoni MT', 'Noto Serif Display', 'URW Palladio L', 'P052', 'Sylfaen', 'serif'],
        handwritten:  ['Segoe Print', 'Bradley Hand', 'Chilanka', 'TSCu_Comic', 'casual', 'cursive'],
      },
      maxWidth: {
        '2xl': '40rem',
      },
      keyframes: {
        'bounce-slide-down': {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '60%': { transform: 'translate(-50%, 10%)', opacity: '1' },
          '80%': { transform: 'translate(-50%, -5%)' },
          '100%': { transform: 'translate(-50%, 0)' }
        }
      },
      animation: {
        'bounce-slide-down': 'bounce-slide-down 0.5s ease-out'
      }
    },
  },
  plugins: [formsPlugin, headlessuiPlugin, require('@tailwindcss/typography')],
}
