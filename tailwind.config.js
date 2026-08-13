/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7A1F2B',
          hover: '#621822',
          light: '#912836',
          bg: '#7A1F2B15',
        },
        background: {
          DEFAULT: '#F4F0E6',
          muted: '#EAE3D5',
        },
        surface: {
          DEFAULT: '#FBF9F4',
          card: '#FFFFFF',
          border: '#D8D0C1',
        },
        brand: {
          maroon: '#7A1F2B',
          bone: '#F4F0E6',
          cream: '#FBF9F4',
          ivory: '#EAE3D5',
          sand: '#D8D0C1',
          gold: '#B8953D',
          forest: '#28553F',
          espresso: '#211E1A',
          warmGray: '#756F66',
        }
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
