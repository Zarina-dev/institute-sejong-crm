import { CalendarOutlined } from '@ant-design/icons'
import { Select } from 'antd'

import { usePreferences } from '../app/preferences'

type YearSelectProps = {
  years: Array<string | number>
  value: string | number | null
  onChange: (value: string) => void
  /** Adds an "all years" entry at the top (admin lists use it). */
  allowAll?: boolean
}

/** The value `allowAll` uses; `null` cannot be a Select value. */
export const ALL_YEARS = 'all'

/**
 * One year, picked from a list. A dropdown rather than a row of buttons:
 * the list grows by one every year, and only the chosen year needs to be on
 * screen.
 */
export function YearSelect({ years, value, onChange, allowAll = false }: YearSelectProps) {
  const { t } = usePreferences()

  return (
    <Select
      className="year-select"
      aria-label={t('terms.year')}
      value={value == null ? ALL_YEARS : String(value)}
      onChange={onChange}
      suffixIcon={<CalendarOutlined />}
      popupMatchSelectWidth={false}
      options={[
        ...(allowAll ? [{ value: ALL_YEARS, label: t('terms.allYears') }] : []),
        ...years.map((year) => ({ value: String(year), label: String(year) })),
      ]}
    />
  )
}
