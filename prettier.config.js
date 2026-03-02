/** @type {import('prettier').Options} */
module.exports = {
  singleQuote: true,
  semi: false,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
      {
          files: '*.{js,jsx}',
          options: {
              tabWidth: 4,
          },
      },
  ],
}
