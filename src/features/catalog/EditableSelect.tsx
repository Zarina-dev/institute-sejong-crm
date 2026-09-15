import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Divider, Input, Select, Tooltip } from 'antd'
import { memo, useState, type MouseEvent } from 'react'

import { useConfirmDelete } from '../../shared/useConfirmDelete'
import {
  addCatalogItem,
  MAX_CATALOG_ITEM_LENGTH,
  removeCatalogItem,
  type CatalogKind,
  type CatalogOption,
} from './catalogStore'

type EditableSelectProps = {
  kind: CatalogKind
  options: CatalogOption[]
  /** Supplied by Form.Item when used inside a form. */
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  addPlaceholder: string
  size?: 'small' | 'middle' | 'large'
  allowClear?: boolean
  /** Select the item right after adding it — wanted in the create/edit form,
   *  not in the filter bar where it would silently change the query. */
  selectOnAdd?: boolean
}

/** Stops a click inside an option from also selecting that option. */
function swallow(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
}

/**
 * Select whose option list can be extended and pruned in place: a text field
 * in the dropdown footer adds an item, and each option carries a delete
 * button. Backed by the shared catalog store, so every other picker in the
 * app reflects the change immediately.
 *
 * Memoised because it sits in filter bars that re-render on every keystroke
 * of the search box; its own props only change when the catalog or the
 * selected value does.
 */
export const EditableSelect = memo(function EditableSelect({
  kind,
  options,
  value,
  onChange,
  placeholder,
  addPlaceholder,
  size,
  allowClear,
  selectOnAdd = false,
}: EditableSelectProps) {
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const next = draft.trim()
    const result = addCatalogItem(kind, next)

    if (!result.ok) {
      if (result.reason === 'duplicate') {
        message.warning(`이미 등록된 항목입니다: ${next}`)
      } else if (result.reason === 'tooLong') {
        message.warning(`${MAX_CATALOG_ITEM_LENGTH}자 이내로 입력하세요.`)
      }
      // `empty` needs no message — the button is disabled in that case.
      return
    }

    setDraft('')
    message.success(`추가되었습니다: ${next}`)

    if (selectOnAdd) {
      onChange?.(next)
    }
  }

  const handleRemove = (event: MouseEvent, item: string) => {
    swallow(event)

    confirmDelete({
      target: item,
      // Only the pick-list entry goes away; materials already saved with this
      // value keep it, and the entry can simply be typed in again.
      note: '목록에서만 제거되며, 이미 저장된 자료의 값은 그대로 유지됩니다.',
      onConfirm: () => {
        removeCatalogItem(kind, item)

        // The form field would otherwise keep pointing at an item that is no
        // longer offered.
        if (value === item) {
          onChange?.(undefined)
        }

        message.success(`삭제되었습니다: ${item}`)
      },
    })
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      size={size}
      allowClear={allowClear}
      optionRender={(option) => (
        <div className="catalog-option">
          <span>{option.label}</span>
          <Tooltip title="삭제">
            <Button
              type="text"
              size="small"
              aria-label={`${String(option.value)} 삭제`}
              icon={<DeleteOutlined />}
              onMouseDown={swallow}
              onClick={(event) => handleRemove(event, String(option.value))}
            />
          </Tooltip>
        </div>
      )}
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <div className="catalog-adder">
            <Input
              value={draft}
              placeholder={addPlaceholder}
              maxLength={MAX_CATALOG_ITEM_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              // Keep typing (and Enter) from reaching the Select, which would
              // otherwise close the dropdown or jump between options.
              onKeyDown={(event) => {
                event.stopPropagation()

                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!draft.trim()}
              onClick={handleAdd}
            >
              추가
            </Button>
          </div>
        </>
      )}
    />
  )
})
