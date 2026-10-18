import { useEffect, useState } from 'react'

/**
 * `value`, once it has stopped changing for `delay` ms — for typed text that
 * drives a request: one request when the visitor pauses, not one per key.
 * Emptying the field applies at once (clearing a search should not wait).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    if (value === '' || value === undefined || value === null) {
      setSettled(value)
      return
    }
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
