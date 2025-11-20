/**
 * PostCSS configuration.
 * We delegate Tailwind processing to the official Tailwind PostCSS plugin.
 * Add more plugins (autoprefixer, cssnano, nesting) in this object as needed.
 */
const config = {
  plugins: {
    // TailwindCSS processing pipeline
    "@tailwindcss/postcss": {},
  },
};

export default config;
