import { App } from 'antd'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { apiGet } from '../api/client'
import { usePreferences } from '../app/preferences'

/**
 * Opens a record's edit dialog from a link — `/admin/staff?edit=<id>`, as
 * 작업 기록 links its entries. The record is taken from the list the page has
 * already loaded; one the page is not showing (another semester, another
 * page of results) is fetched on its own from `GET <path>/<id>`. The `edit`
 * parameter is then dropped from the address, so a reload or the back
 * button does not open the dialog again.
 *
 * `rows` is undefined while the page's list is loading: the link waits.
 */
export function useEditLink<T extends { id: string }>(rows: readonly T[] | undefined, open: (row: T) => void, path: string) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const requested = params.get('edit')
  // Remembered from the address the page opened with: some screens rewrite
  // their address as they load (강좌 adds ?view=…), which would drop it.
  const pending = useRef<string | null>(requested)
  if (requested && requested !== pending.current) pending.current = requested
  const id = pending.current
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!id || handled.current === id || rows === undefined) return
    handled.current = id
    pending.current = null

    const clear = () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('edit')
          return next
        },
        { replace: true },
      )

    const found = rows.find((row) => row.id === id)
    if (found) {
      open(found)
      clear()
      return
    }

    apiGet<T>(`${path}/${id}`)
      .then(open, () => message.info(t('audit.recordGone')))
      .finally(clear)
  }, [id, message, open, path, rows, setParams, t])
}
