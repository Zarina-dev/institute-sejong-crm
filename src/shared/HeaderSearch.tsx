import { CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Input, Tooltip } from 'antd'
import { useState } from 'react'

import { usePreferences } from '../app/preferences'

/**
 * The magnifier in a page header: one button, opening into a search box.
 * The lists it searches are short enough to read whole, so there is no
 * filter bar — only this, the same on every page that has it. Closing it
 * clears the search.
 */
export function HeaderSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const { t } = usePreferences()
  const [open, setOpen] = useState(Boolean(value))

  if (!open) {
    return (
      <Tooltip title={t('common.search')}>
        <Button className="icon-button" icon={<SearchOutlined />} aria-label={t('common.search')} onClick={() => setOpen(true)} />
      </Tooltip>
    )
  }

  return (
    <div className="material-search">
      <Input
        autoFocus
        allowClear
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        prefix={<SearchOutlined />}
        aria-label={placeholder}
      />
      <Button
        type="text"
        icon={<CloseOutlined />}
        aria-label={t('common.cancel')}
        onClick={() => {
          setOpen(false)
          onChange('')
        }}
      />
    </div>
  )
}
