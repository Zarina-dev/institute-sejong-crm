import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Tag, Typography } from 'antd'
import { memo, type ReactNode } from 'react'

import { usePreferences } from '../../app/preferences'
import type { CourseRecord } from './types'

const { Paragraph, Text } = Typography

type CourseCardProps = {
  course: CourseRecord
  /** Action area (apply button, status tag…) rendered under the details. */
  footer?: ReactNode
}

/** One course in a grid; memoised for the same reason as MaterialCard. */
export const CourseCard = memo(function CourseCard({ course, footer }: CourseCardProps) {
  const { t } = usePreferences()
  const period = course.startDate || course.endDate ? `${course.startDate || '…'} ~ ${course.endDate || '…'}` : null

  return (
    <Card className="surface-card course-card" title={course.title} extra={<Tag>{course.subject}</Tag>}>
      <Paragraph type="secondary" ellipsis={{ rows: 3, tooltip: course.description ?? undefined }}>
        {course.description || t('courses.noDescription')}
      </Paragraph>

      <dl className="course-facts">
        <div>
          <dt><UserOutlined /> {t('courses.teacher')}</dt>
          <dd>{course.teacherName || '-'}</dd>
        </div>
        <div>
          <dt><ClockCircleOutlined /> {t('courses.time')}</dt>
          <dd>{course.schedule || '-'}</dd>
        </div>
        <div>
          <dt><EnvironmentOutlined /> {t('courses.room')}</dt>
          <dd>{course.classroom || '-'}</dd>
        </div>
        <div>
          <dt><CalendarOutlined /> {t('courses.period')}</dt>
          <dd>{period ?? <Text type="secondary">{t('courses.periodUnset')}</Text>}</dd>
        </div>
      </dl>

      {footer ? <div className="course-card-footer">{footer}</div> : null}
    </Card>
  )
})
