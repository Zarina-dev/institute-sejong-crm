import { ExclamationCircleFilled } from '@ant-design/icons'
import { App } from 'antd'
import { useCallback, type ReactNode } from 'react'

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
 *
 * Requires an <App> from antd above it in the tree (see main.tsx).
 */
export function useConfirmDelete() {
  const { modal } = App.useApp()

  return useCallback(
    ({ target, note, onConfirm }: ConfirmDeleteOptions) => {
      modal.confirm({
        title: '삭제 확인',
        icon: <ExclamationCircleFilled />,
        content: (
          <div className="confirm-delete">
            <p>정말 삭제하시겠습니까?</p>
            <strong>{target}</strong>
            <p>{note ?? '이 작업은 되돌릴 수 없습니다.'}</p>
          </div>
        ),
        okText: '삭제',
        okButtonProps: { danger: true },
        cancelText: '취소',
        onOk: onConfirm,
      })
    },
    [modal],
  )
}
