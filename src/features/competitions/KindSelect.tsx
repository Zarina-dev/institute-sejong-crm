import { TrophyOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import { useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { ALL_KINDS } from './kinds'
import type { CompetitionKind } from './types'

type KindOption = { value: string; label: string }

type KindSelectProps = {
  /** Supplied by Form.Item. */
  value?: CompetitionKind
  onChange?: (kind: CompetitionKind) => void
  /** Every competition on record, built-ins first. */
  options: KindOption[]
  disabled?: boolean
}

/**
 * 대회 구분 — picked from the competitions already on record. The institute
 * starts new ones, so the name can also simply be typed: what is typed turns
 * into an entry at the foot of the list, and choosing it adds that
 * competition. No separate screen for managing the list; the first record
 * entered under a name is what creates it.
 */
export function CompetitionKindSelect({ value, onChange, options, disabled }: KindSelectProps) {
  const { t } = usePreferences()
  const [typed, setTyped] = useState('')

  const name = typed.trim()
  const known = (candidate: string) => options.some((option) => option.value === candidate || option.label === candidate)

  const items = [
    ...options,
    // A kind chosen a moment ago is not in the records yet.
    ...(value && !known(value) && value !== name ? [{ value, label: value }] : []),
    ...(name && !known(name) ? [{ value: name, label: t('competitions.form.addKindAs', { name }) }] : []),
  ]

  return (
    <Select
      className="kind-select"
      value={value}
      onChange={(next) => {
        setTyped('')
        onChange?.(next)
      }}
      onSearch={setTyped}
      onBlur={() => setTyped('')}
      disabled={disabled}
      showSearch
      filterOption={false}
      suffixIcon={<TrophyOutlined />}
      placeholder={t('competitions.form.kindPlaceholder')}
      notFoundContent={null}
      options={items}
    />
  )
}

type KindFilterProps = {
  value: string
  onChange: (kind: string) => void
  options: KindOption[]
}

/**
 * The same list, read as a filter: 전체 and then every competition on
 * record. A dropdown rather than a row of buttons, because the institute
 * adds competitions and only the chosen one needs to be on screen.
 */
export function CompetitionKindFilter({ value, onChange, options }: KindFilterProps) {
  const { t } = usePreferences()

  return (
    <Select
      className="kind-select"
      aria-label={t('competitions.form.kind')}
      value={value}
      onChange={onChange}
      suffixIcon={<TrophyOutlined />}
      popupMatchSelectWidth={false}
      options={[{ value: ALL_KINDS, label: t('competitions.allKinds') }, ...options]}
    />
  )
}
