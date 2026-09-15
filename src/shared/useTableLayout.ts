import { Grid } from 'antd'

/**
 * Responsive knobs for the admin tables.
 *
 * - `pinActions`: pin the 관리 column on the right so it stays reachable while
 *   the rest scrolls — but only from `md` up. On a phone a pinned 260px column
 *   would cover the whole viewport and hide the data columns under it.
 * - `compactActions`: icon-only action buttons below `md`.
 */
export function useTableLayout() {
  const screens = Grid.useBreakpoint()
  const wide = screens.md ?? true // undefined on first render → assume desktop

  return {
    pinActions: wide ? ('right' as const) : undefined,
    compactActions: !wide,
  }
}
