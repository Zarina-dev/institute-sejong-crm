import { ExclamationCircleFilled } from '@ant-design/icons'
import { App } from 'antd'
import { useCallback, useMemo, useRef } from 'react'

import { usePreferences } from '../app/preferences'

/**
 * Asks before throwing away what the admin typed — closing a form dialog,
 * switching the language tab of a content block. Nothing typed, nothing
 * asked: `onDiscard` runs straight away.
 *
 * An in-page antd dialog (not `window.confirm`), styled like the delete
 * confirmation and following the theme and language.
 */
export function useConfirmDiscard() {
  const { modal } = App.useApp()
  const { t } = usePreferences()

  return useCallback(
    (dirty: boolean, onDiscard: () => void) => {
      if (!dirty) {
        onDiscard()
        return
      }

      modal.confirm({
        title: t('confirm.discardTitle'),
        icon: <ExclamationCircleFilled />,
        content: t('confirm.discardQuestion'),
        okText: t('confirm.discardOk'),
        okButtonProps: { danger: true },
        cancelText: t('confirm.keepEditing'),
        onOk: onDiscard,
      })
    },
    [modal, t],
  )
}

/**
 * Tracks whether the admin has changed a form since it was filled.
 *
 * Pass `onValuesChange` to the `<Form>`: antd calls it for the admin's own
 * input only, never for `setFieldsValue` — so filling a dialog with a record,
 * or a body that arrives later, does not count as an edit. (`isFieldsTouched`
 * cannot tell the two apart: a programmatic value change marks a field
 * touched too.) Call `markClean` whenever the form is (re)filled or saved;
 * `guard(proceed)` runs `proceed` at once, or after a confirmation when there
 * is something to lose.
 */
export function useUnsavedChanges() {
  const dirty = useRef(false)
  const confirmDiscard = useConfirmDiscard()

  return useMemo(
    () => ({
      onValuesChange: () => {
        dirty.current = true
      },
      markClean: () => {
        dirty.current = false
      },
      guard: (proceed: () => void) =>
        confirmDiscard(dirty.current, () => {
          dirty.current = false
          proceed()
        }),
    }),
    [confirmDiscard],
  )
}
