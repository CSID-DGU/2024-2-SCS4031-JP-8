/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  plugins: [],
  purge: [
    './src/**/*.vue', // src 폴더 안의 모든 Vue 파일 포함
    './public/**/*.html' // public 폴더의 HTML 파일들 포함
  ]
}
