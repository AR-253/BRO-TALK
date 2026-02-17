/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Return to default Tailwind colors or Original Brand overrides if any were here
            },
            animation: {
                'blob': 'blob 10s infinite', // Slower, more relaxing
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)', opacity: 0.1 },
                    '33%': { transform: 'translate(20px, -30px) scale(1.05)', opacity: 0.15 },
                    '66%': { transform: 'translate(-15px, 15px) scale(0.95)', opacity: 0.1 },
                    '100%': { transform: 'translate(0px, 0px) scale(1)', opacity: 0.1 },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(15px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)', // Deeper shadow for professional feel
                'den': '0 4px 12px 0 rgba(0, 0, 0, 0.25)',
            }
        },
    },
    plugins: [],
}
