import type { CourseSession, Weekday } from './types'

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]

/** 2024-01-01 is a Monday; adding (weekday − 1) days yields each weekday. */
function sampleDate(weekday: Weekday) {
  return new Date(Date.UTC(2024, 0, weekday))
}

const cache = new Map<string, Map<Weekday, string>>()

/** Localized short weekday names keyed by ISO weekday ("월", "Mon", "пн"). */
export function weekdayNames(language: string): Map<Weekday, string> {
  let names = cache.get(language)

  if (!names) {
    const fmt = new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' })
    names = new Map(WEEKDAYS.map((day) => [day, fmt.format(sampleDate(day))]))
    cache.set(language, names)
  }

  return names
}

export function weekdayOptions(language: string) {
  const names = weekdayNames(language)
  return WEEKDAYS.map((value) => ({ value, label: names.get(value)! }))
}

/**
 * Compact summary of a weekly pattern: sessions sharing a time slot are
 * merged — "월·수 09:00–10:30 · A-101 / 금 14:00–15:30".
 */
export function formatSessions(sessions: CourseSession[] | undefined, language: string, fallbackRoom?: string | null): string[] {
  if (!sessions?.length) {
    return []
  }

  const names = weekdayNames(language)
  const groups = new Map<string, { days: Weekday[]; startTime: string; endTime: string; classroom: string | null }>()

  for (const session of [...sessions].sort((a, b) => a.weekday - b.weekday)) {
    const room = session.classroom ?? fallbackRoom ?? null
    const key = `${session.startTime}-${session.endTime}-${room ?? ''}`
    const group = groups.get(key) ?? { days: [], startTime: session.startTime, endTime: session.endTime, classroom: room }
    group.days.push(session.weekday)
    groups.set(key, group)
  }

  return [...groups.values()]
    .sort((a, b) => a.days[0] - b.days[0] || a.startTime.localeCompare(b.startTime))
    .map((group) => {
      const days = group.days.map((day) => names.get(day)).join('·')
      return `${days} ${group.startTime}–${group.endTime}${group.classroom ? ` · ${group.classroom}` : ''}`
    })
}

const minutesOf = (time: string) => {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

/**
 * Clock hours a weekly pattern adds up to (월·수 09:00–10:30 → 3), rounded
 * to one decimal. Only a suggestion for 주 시간: institutes count teaching
 * periods their own way, so the field stays editable.
 */
export function weeklyHoursFromSessions(sessions: CourseSession[] | undefined): number | null {
  if (!sessions?.length) {
    return null
  }

  const total = sessions.reduce((sum, session) => sum + Math.max(0, minutesOf(session.endTime) - minutesOf(session.startTime)), 0)
  return Math.round((total / 60) * 10) / 10
}

/**
 * The weekly pattern split the way the semester table prints it:
 * `{ days: "월·수", time: "15:00–16:20" }` per distinct slot.
 */
export function sessionParts(sessions: CourseSession[] | undefined, language: string): Array<{ days: string; time: string }> {
  if (!sessions?.length) {
    return []
  }

  const names = weekdayNames(language)
  const groups = new Map<string, { days: Weekday[]; startTime: string; endTime: string }>()

  for (const session of [...sessions].sort((a, b) => a.weekday - b.weekday)) {
    const key = `${session.startTime}-${session.endTime}`
    const group = groups.get(key) ?? { days: [], startTime: session.startTime, endTime: session.endTime }
    group.days.push(session.weekday)
    groups.set(key, group)
  }

  return [...groups.values()]
    .sort((a, b) => a.days[0] - b.days[0] || a.startTime.localeCompare(b.startTime))
    .map((group) => ({
      days: group.days.map((day) => names.get(day)).join('·'),
      time: `${group.startTime}–${group.endTime}`,
    }))
}
