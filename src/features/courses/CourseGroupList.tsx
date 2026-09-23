import { Card, Col, Empty, Row, Skeleton, Typography } from 'antd'
import { useMemo, type ReactNode } from 'react'

import { usePreferences } from '../../app/preferences'
import { CourseCard } from './CourseCard'
import { groupCourses } from './grouping'
import type { CourseRecord } from './types'

const { Title, Text } = Typography

type CourseGroupListProps = {
  courses: CourseRecord[] | undefined
  loading: boolean
  /** Optional per-card action area. */
  renderFooter?: (course: CourseRecord) => ReactNode
  emptyText: string
}

/**
 * Courses as programme sections — "한국어" with 한국어 1/2/3 under it, then
 * "영어", "기타"… Used by the public 수강 page.
 */
export function CourseGroupList({ courses, loading, renderFooter, emptyText }: CourseGroupListProps) {
  const { t } = usePreferences()
  const groups = useMemo(() => groupCourses(courses), [courses])

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: 3 }, (_, index) => (
          <Col xs={24} md={12} lg={8} key={index}>
            <Card className="surface-card">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  if (groups.length === 0) {
    return (
      <Card className="surface-card empty-card">
        <Empty description={emptyText} />
      </Card>
    )
  }

  return (
    <div className="course-groups">
      {groups.map((group) => (
        <section className="course-group" key={group.title} aria-labelledby={`course-group-${group.title}`}>
          <div className="course-group__heading">
            <Title level={2} id={`course-group-${group.title}`}>
              {group.title}
            </Title>
            <Text type="secondary">{t('courses.classCount', { count: group.courses.length })}</Text>
          </div>
          <Row gutter={[16, 16]}>
            {group.courses.map((course) => (
              <Col xs={24} md={12} lg={8} key={course.id}>
                <CourseCard course={course} footer={renderFooter?.(course)} />
              </Col>
            ))}
          </Row>
        </section>
      ))}
    </div>
  )
}
