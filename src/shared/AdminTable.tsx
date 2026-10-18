import { Table } from 'antd'
import type { TableProps } from 'antd'
import { memo, useMemo, type ReactNode } from 'react'

const SCROLL: TableProps['scroll'] = { x: 'max-content' }

type AdminTableProps<T> = Omit<TableProps<T>, 'pagination' | 'scroll' | 'locale'> & {
  /** What an empty table says. */
  emptyText: ReactNode
}

/**
 * An admin list shown whole (no paging), side-scrolling when it is wider
 * than the screen — the setup the admin tables share. Memoised: with stable
 * `columns` and `dataSource` the page around it can re-render (a dialog
 * opening, a field typed in) without redrawing every row.
 */
function AdminTableInner<T extends object>({ emptyText, className = 'admin-table', ...props }: AdminTableProps<T>) {
  const locale = useMemo(() => ({ emptyText }), [emptyText])
  return <Table<T> className={className} pagination={false} scroll={SCROLL} locale={locale} {...props} />
}

export const AdminTable = memo(AdminTableInner) as typeof AdminTableInner
