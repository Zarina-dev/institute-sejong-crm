/**
 * Tailwind was removed: no utility class was used anywhere in src/, so the
 * only thing it contributed was its preflight reset — which conflicts with
 * Ant Design's own reset. styles/base.css replaces it.
 */
export default {
  plugins: {
    autoprefixer: {},
  },
}
