/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                maritime: {
                    50: '#f7fbfd',
                    100: '#eaf6fb',
                    200: '#cfeff6',
                    300: '#a8e6ee',
                    400: '#66d6e0',
                    500: '#1aa6b8',
                    600: '#158a98',
                    700: '#116a73',
                    800: '#0d4b4f',
                    900: '#083035'
                },
                sand: {
                    50: '#fffaf5',
                    100: '#fff3e6',
                    200: '#ffe6cc',
                    300: '#ffd1a3',
                    400: '#ffb66b',
                    500: '#ff9b33',
                    600: '#e67f1f',
                    700: '#b85f19',
                    800: '#8a4613',
                    900: '#5e2b0c'
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            container: {
                center: true,
                padding: '1rem',
            }
        },
    },
    plugins: [],
}