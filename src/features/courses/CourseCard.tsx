import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Typography } from 'antd'
import { memo, useMemo, type ReactNode } from 'react'

import { usePreferences } from '../../app/preferences'
import { formatDateRange } from '../../shared/format'
import { formatSessions } from './sessions'
import type { CourseRecord } from './types'

const { Text } = Typography

type CourseCardProps = {
  course: CourseRecord
  /** Action area (apply button, status tag…) rendered under the details. */
  footer?: ReactNode
}

/**
 * One class in a grid. The card reads top-down as a schedule entry: name,
 * when it meets (the fact people look for first), where, who teaches it,
 * and the term. Lists are already grouped by programme, so the programme
 * is not repeated here.
 */
export const CourseCard = memo(function CourseCard({ course, footer }: CourseCardProps) {
  const { t, language } = usePreferences()
  const sessions = useMemo(() => formatSessions(course.sessions, language, course.classroom), [course.sessions, course.classroom, language])
  const period = useMemo(() => formatDateRange(course.startDate, course.endDate, language), [course.startDate, course.endDate, language])
  // Session lines already carry the room (own or the course default); a separate row only when there are no sessions.
  const roomOnSessions = sessions.length > 0

  return (
    <Card className="surface-card course-card">
      <Text className="course-card__name">{course.subject || course.title}</Text>
      {/* Clamped in CSS, not with Paragraph's `ellipsis`: that measures each
          card in the DOM (getBoundingClientRect twice per card), a forced
          layout per card that made a long list O(N²) — 63% of the main
          thread with a few thousand classes. `title` keeps the full text. */}
      {course.description ? (
        <p className="course-card__description" title={course.description}>
          {course.description}
        </p>
      ) : null}

      <ul className="course-meta">
        <li className="course-meta__time">
          <ClockCircleOutlined />
          <span>
            {sessions.length ? sessions.map((line) => <span key={line}>{line}</span>) : <Text type="secondary">{t('courses.sessions.none')}</Text>}
          </span>
        </li>
        {course.classroom && !roomOnSessions ? (
          <li>
            <EnvironmentOutlined />
            <span>{course.classroom}</span>
          </li>
        ) : null}
        {course.teacherName ? (
          <li>
            <UserOutlined />
            <span>{course.teacherName}</span>
          </li>
        ) : null}
        <li>
          <CalendarOutlined />
          <span>{period ?? <Text type="secondary">{t('courses.periodUnset')}</Text>}</span>
        </li>
      </ul>

      {footer ? <div className="course-card-footer">{footer}</div> : null}
    </Card>
  )
})
