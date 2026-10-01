import { Select, Typography } from 'antd'

import { usePreferences } from '../../app/preferences'
import { termLabel } from '../courses/terms'
import { termInProgress } from './current'
import type { AcademicTerm } from './types'

const { Text } = Typography

type TermSelectProps = {
  /** Supplied by Form.Item — the term's code. */
  value?: string | null
  onChange?: (code: string) => void
  terms: AcademicTerm[]
  disabled?: boolean
}

/**
 * The semester a class runs in, picked from 학기 관리. The one in progress
 * carries a small lit dot, so the admin can see at a glance which semester
 * the institute is in without reading the dates.
 */
export function TermSelect({ value, onChange, terms, disabled }: TermSelectProps) {
  const { t } = usePreferences()
  const live = termInProgress(terms)

  const name = (term: AcademicTerm) => term.name || termLabel(term.code, t)

  const options = terms.map((term) => ({
    value: term.code,
    label: (
      <span className="term-option">
        <span className={`term-led${term.code === live?.code ? ' is-live' : ''}`} aria-hidden="true" />
        <span className="term-option__name">{name(term)}</span>
        <Text type="secondary" className="term-option__dates">
          {term.startDate} ~ {term.endDate}
        </Text>
      </span>
    ),
  }))

  // A class filed under a semester that is no longer defined keeps its place.
  const unknown = value && !terms.some((term) => term.code === value)

  return (
    <Select
      className="term-select"
      value={value ?? undefined}
      onChange={onChange}
      disabled={disabled}
      placeholder={t('terms.pick')}
      optionLabelProp="label"
      popupMatchSelectWidth={false}
      options={unknown ? [...options, { value, label: termLabel(value, t) }] : options}
      notFoundContent={t('terms.noneDefined')}
    />
  )
}
