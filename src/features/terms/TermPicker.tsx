import { Segmented } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import type { TranslationKey } from '../../app/preferences'
import { YearSelect } from '../../shared/YearSelect'
import type { AcademicTerm, TermKind } from './types'

const KIND_LABEL: Record<TermKind, TranslationKey> = {
  first: 'terms.first',
  second: 'terms.second',
  break: 'terms.breakKind',
}

type TermPickerProps = {
  terms: AcademicTerm[]
  active: AcademicTerm | null
  onSelect: (code: string) => void
}

/**
 * The year, then the semester inside it — the picker 학사 일정 introduced,
 * shared by every page that reads one semester. Each part appears only when
 * there is something to choose between.
 */
export function TermPicker({ terms, active, onSelect }: TermPickerProps) {
  const { t } = usePreferences()

  const years = useMemo(() => [...new Set(terms.map((term) => String(term.year)))].sort().reverse(), [terms])
  const termsOfYear = useMemo(() => terms.filter((term) => String(term.year) === String(active?.year)), [active?.year, terms])

  return (
    <div className="term-picker">
      {years.length > 1 ? (
        <YearSelect
          years={years}
          value={active?.year ?? years[0]}
          onChange={(value) => {
            // Keep the same kind of term where that year has one.
            const ofYear = terms.filter((term) => String(term.year) === value)
            const next = ofYear.find((term) => term.kind === active?.kind) ?? ofYear[0]

            if (next) {
              onSelect(next.code)
            }
          }}
        />
      ) : null}

      {termsOfYear.length > 1 ? (
        <Segmented
          aria-label={t('terms.label')}
          value={active?.code}
          onChange={(value) => onSelect(String(value))}
          options={termsOfYear.map((term) => ({ value: term.code, label: term.name || t(KIND_LABEL[term.kind]) }))}
        />
      ) : null}
    </div>
  )
}
