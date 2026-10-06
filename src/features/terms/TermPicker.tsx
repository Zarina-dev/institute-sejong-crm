import { Select, Typography } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { termInProgress } from './current'
import { termDisplayName } from './labels'
import type { AcademicTerm } from './types'

const { Text } = Typography

/** The value of the optional "every semester" entry; never a term code. */
const ALL = '__all__'

/** One entry of the dropdown; the year groups only hold these. */
type TermOption = {
  value: string
  name: string
  isLive: boolean
  empty: boolean
  disabled: boolean
}

type TermPickerProps = {
  terms: AcademicTerm[]
  active: AcademicTerm | null
  onSelect: (code: string) => void
  /**
   * How many items this page has in each semester. Semesters with none are
   * greyed out — except the one in progress and the one on screen, which
   * stay choosable so the page can say plainly that it is empty.
   */
  counts?: Map<string, number>
  /** Shown beside a greyed-out semester: "강좌 없음", "행사 없음" … */
  emptyHint?: string
  /** An "every semester" entry at the top, for pages that offer one. */
  all?: { label: string; selected: boolean; onSelect: () => void }
}

/**
 * 학기 선택 — the one semester picker the site uses, on the pages that read
 * one semester at a time (강좌 안내, 문화 강좌, 학사 일정, 행사 일정) and in
 * the admin. It is a filter inside the page, never a level of navigation:
 * the page opens on the semester in progress (useTermChoice), and choosing
 * another changes only what the page shows.
 *
 * One dropdown rather than buttons: the list grows by a few entries a year.
 * Years are groups, newest first; inside a year the terms read in the order
 * they run (1학기, 여름방학, 2학기, 겨울방학). The semester in progress has the
 * same small lit dot as in the admin course form.
 */
export function TermPicker({ terms, active, onSelect, counts, emptyHint, all }: TermPickerProps) {
  const { t } = usePreferences()
  const live = termInProgress(terms)

  const groups = useMemo(() => {
    const byYear = new Map<number, AcademicTerm[]>()

    for (const term of terms) {
      const bucket = byYear.get(term.year)

      if (bucket) {
        bucket.push(term)
      } else {
        byYear.set(term.year, [term])
      }
    }

    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => ({
        label: t('terms.yearGroup', { year }),
        title: String(year),
        options: [...list]
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .map((term): TermOption => {
            const empty = counts ? (counts.get(term.code) ?? 0) === 0 : false
            const isLive = term.code === live?.code

            return {
              value: term.code,
              name: termDisplayName(term, t),
              isLive,
              empty,
              disabled: empty && !isLive && term.code !== active?.code,
            }
          }),
      }))
  }, [active?.code, counts, live?.code, t, terms])

  const allOption: TermOption[] = all
    ? [
        {
          value: ALL,
          name: all.label,
          isLive: false,
          empty: false,
          disabled: false,
        },
      ]
    : []
  const options = [...allOption, ...groups]

  return (
    <div className="term-picker">
      <Text className="term-picker__label">{t('terms.pickerLabel')}</Text>
      <Select
        className="term-picker__select"
        aria-label={t('terms.pickerLabel')}
        value={all?.selected ? ALL : active?.code}
        onChange={(value: string) => (value === ALL ? all?.onSelect() : onSelect(value))}
        popupMatchSelectWidth={false}
        options={options}
        // Called for entries only — year groups render their own label.
        optionRender={(option) => {
          const data = option.data as TermOption

          return (
            <span className="term-option">
              <span className={`term-led${data.isLive ? ' is-live' : ''}`} aria-hidden="true" />
              <span className="term-option__name">{data.name}</span>
              {data.isLive ? <Text className="term-option__tag">{t('terms.current')}</Text> : null}
              {data.empty && emptyHint ? (
                <Text type="secondary" className="term-option__dates">
                  {emptyHint}
                </Text>
              ) : null}
            </span>
          )
        }}
        // Closed, it shows the name — with the dot when it is the current one.
        labelRender={({ value }) => {
          if (value === ALL) {
            return all?.label
          }

          const term = terms.find((item) => item.code === value)

          return term ? (
            <span className="term-option">
              <span className={`term-led${term.code === live?.code ? ' is-live' : ''}`} aria-hidden="true" />
              <span className="term-option__name">{termDisplayName(term, t)}</span>
            </span>
          ) : null
        }}
      />
    </div>
  )
}
