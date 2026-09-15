import { Alert } from 'antd'
import { memo } from 'react'

import { getErrorMessage } from './errors'

type ErrorAlertProps = {
  /** Whatever a query or mutation rejected with; `null`/`undefined` renders nothing. */
  error: unknown
  /** Shown when the error carries no usable message. */
  fallback: string
  /** Optional heading; the error text becomes the description. */
  title?: string
}

/** Renders a query/mutation error consistently, or nothing at all. */
export const ErrorAlert = memo(function ErrorAlert({ error, fallback, title }: ErrorAlertProps) {
  if (!error) {
    return null
  }

  const message = getErrorMessage(error, fallback)

  return title ? (
    <Alert type="error" showIcon message={title} description={message} />
  ) : (
    <Alert type="error" showIcon message={message} />
  )
})
