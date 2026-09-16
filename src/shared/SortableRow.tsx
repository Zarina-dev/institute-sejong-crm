import { HolderOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from 'antd'
import { createContext, useContext, useMemo, type CSSProperties, type HTMLAttributes } from 'react'

type RowContextValue = {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: Record<string, unknown>
}

const RowContext = createContext<RowContextValue>({})

/**
 * Table row for antd `<Table components={{ body: { row: SortableRow } }}>`
 * inside a dnd-kit `SortableContext`. Only the handle starts a drag, so
 * buttons and text in the row keep working normally.
 */
export function SortableRow(props: HTMLAttributes<HTMLTableRowElement> & { 'data-row-key': string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  })

  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 2, boxShadow: 'var(--shadow-md)' } : {}),
  }

  const context = useMemo<RowContextValue>(() => ({ setActivatorNodeRef, listeners }), [setActivatorNodeRef, listeners])

  return (
    <RowContext.Provider value={context}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  )
}

export function DragHandle({ label }: { label: string }) {
  const { setActivatorNodeRef, listeners } = useContext(RowContext)

  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      aria-label={label}
      title={label}
      className="drag-handle"
      ref={setActivatorNodeRef}
      {...listeners}
    />
  )
}
