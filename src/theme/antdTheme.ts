import { theme as antdTheme, type ThemeConfig } from 'antd'

import type { ThemeMode } from '../app/preferences'

/**
 * Ant Design theme derived from the same values as `styles/tokens.css`.
 *
 * Keep the two in sync: the palette below is the TS mirror of the `--brand-*`
 * and `--neutral-*` ramps. Previously AntD ran on `#4c85ff` with a 12px radius
 * while the stylesheet drew `#246bfd` with 8-10px radii, so every AntD button
 * sat next to a hand-styled element in a visibly different blue and shape.
 */
const palette = {
  brand300: '#8fb4ff',
  brand400: '#5b90ff',
  brand500: '#246bfd',
  brand600: '#1555d6',
  brand700: '#1243a8',

  success: '#22855a',
  warning: '#d9791c',
  danger: '#e05252',
  info: '#246bfd',

  text: '#172033',
  textMuted: '#55647b',
  border: '#e3e8f0',
  surface: '#ffffff',
  canvas: '#f6f8fc',

  darkText: '#edf2ff',
  darkTextMuted: '#a9b8cf',
  darkBorder: '#2b3a52',
  darkSurface: '#151d2b',
  darkSurfaceRaised: '#1b2534',
  darkCanvas: '#0d1420',
} as const

const fontFamily =
  "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif"

/** Radii, spacing and type scale shared by both modes. */
const sharedToken = {
  fontFamily,
  fontSize: 14,
  borderRadius: 10,
  borderRadiusSM: 8,
  borderRadiusLG: 14,
  borderRadiusXS: 6,
  controlHeight: 38,
  controlHeightLG: 46,
  lineHeight: 1.5,
  wireframe: false,
} as const

const sharedComponents: NonNullable<ThemeConfig['components']> = {
  Button: { fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none' },
  Card: { paddingLG: 24 },
  Table: { headerSplitColor: 'transparent', cellPaddingBlock: 12 },
  Tag: { borderRadiusSM: 6 },
  Layout: { headerHeight: 72 },
}

export function getAntdTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark'

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...sharedToken,
      colorPrimary: isDark ? palette.brand400 : palette.brand500,
      colorLink: isDark ? palette.brand300 : palette.brand600,
      colorSuccess: palette.success,
      colorWarning: palette.warning,
      colorError: palette.danger,
      colorInfo: palette.info,

      colorText: isDark ? palette.darkText : palette.text,
      colorTextSecondary: isDark ? palette.darkTextMuted : palette.textMuted,
      colorBorder: isDark ? palette.darkBorder : palette.border,
      colorBorderSecondary: isDark ? palette.darkBorder : palette.border,
      colorBgBase: isDark ? palette.darkCanvas : palette.surface,
      colorBgContainer: isDark ? palette.darkSurface : palette.surface,
      colorBgElevated: isDark ? palette.darkSurfaceRaised : palette.surface,
      colorBgLayout: isDark ? palette.darkCanvas : palette.canvas,
    },
    components: {
      ...sharedComponents,
      // The navigation rails are always dark, in both modes, so their AntD
      // children need dark-surface values regardless of `mode`.
      Layout: {
        ...sharedComponents.Layout,
        siderBg: isDark ? '#0b111c' : '#0f172a',
        triggerBg: isDark ? '#0b111c' : '#0f172a',
      },
    },
  }
}

export { palette as themePalette }
