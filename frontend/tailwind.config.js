/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#10b981",
                secondary: "#3b82f6",
                dark: "#0f172a",
                accent: "#f43f5e",
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
