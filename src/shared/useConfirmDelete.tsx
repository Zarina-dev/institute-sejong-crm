import { ExclamationCircleFilled } from '@ant-design/icons'
import { App } from 'antd'
import { useCallback, type ReactNode } from 'react'

import { usePreferences } from '../app/preferences'

type ConfirmDeleteOptions = {
  /** What is about to be deleted — shown in bold inside the dialog. */
  target: string
  /** Replaces the default "this cannot be undone" note. */
  note?: ReactNode
  /** Rejecting keeps the dialog open with its button in a loading state. */
  onConfirm: () => void | Promise<unknown>
}

/**
 * Single confirmation dialog for every destructive action in the app.
 *
 * A modal rather than an inline Popconfirm, for two reasons: it reads as the
 * interruption a destructive action deserves, and it works from inside another
 * popup — the 과목/과정 delete buttons live in a Select dropdown, where a
 * nested Popconfirm fights the dropdown's own click-outside handling.
 */
export function useConfirmDelete() {
  const { modal } = App.useApp()
  const { t } = usePreferences()

  return useCallback(
    ({ target, note, onConfirm }: ConfirmDeleteOptions) => {
      modal.confirm({
        title: t('confirm.title'),
        icon: <ExclamationCircleFilled />,
        content: (
          <div className="confirm-delete">
            <p>{t('confirm.question')}</p>
            <strong>{target}</strong>
            <p>{note ?? t('confirm.irreversible')}</p>
          </div>
        ),
        okText: t('confirm.ok'),
        okButtonProps: { danger: true },
        cancelText: t('confirm.cancel'),
        onOk: onConfirm,
      })
    },
    [modal, t],
  )
}
