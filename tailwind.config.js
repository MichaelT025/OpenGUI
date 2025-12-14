/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/webview/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to not conflict with VSCode
  }
}
