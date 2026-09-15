import { CalendarOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Card, Tag, Typography } from 'antd'
import { memo, type ReactNode } from 'react'

import type { CourseRecord } from './types'

const { Paragraph, Text } = Typography

type CourseCardProps = {
  course: CourseRecord
  /** Action area (apply button, status tag…) rendered under the details. */
  footer?: ReactNode
}

/** One course in a grid; memoised for the same reason as MaterialCard. */
export const CourseCard = memo(function CourseCard({ course, footer }: CourseCardProps) {
  const period = course.startDate || course.endDate ? `${course.startDate || '…'} ~ ${course.endDate || '…'}` : null

  return (
    <Card className="surface-card course-card" title={course.title} extra={<Tag>{course.subject}</Tag>}>
      <Paragraph type="secondary" ellipsis={{ rows: 3, tooltip: course.description ?? undefined }}>
        {course.description || '과정 설명이 없습니다.'}
      </Paragraph>

      <dl className="course-facts">
        <div>
          <dt><UserOutlined /> 강사</dt>
          <dd>{course.teacherName || '-'}</dd>
        </div>
        <div>
          <dt><ClockCircleOutlined /> 시간</dt>
          <dd>{course.schedule || '-'}</dd>
        </div>
        <div>
          <dt><EnvironmentOutlined /> 강의실</dt>
          <dd>{course.classroom || '-'}</dd>
        </div>
        <div>
          <dt><CalendarOutlined /> 기간</dt>
          <dd>{period ?? <Text type="secondary">미정</Text>}</dd>
        </div>
      </dl>

      {footer ? <div className="course-card-footer">{footer}</div> : null}
    </Card>
  )
})
