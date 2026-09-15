const koDate = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

/** ISO string → "2026년 9월 15일". Invalid input renders as "-". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : koDate.format(date)
}

export function formatFileSize(size?: number | null): string {
  if (!size) {
    return '—'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
