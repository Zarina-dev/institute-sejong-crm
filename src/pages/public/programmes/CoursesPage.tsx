import { EnvironmentOutlined, PhoneOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { CourseGroupList } from '../../../features/courses/CourseGroupList'
import { compareNatural } from '../../../features/courses/grouping'
import { useCourses } from '../../../features/courses/queries'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

type CoursesPageProps = {
  /** 강좌 안내 (language) or 문화 강좌 (culture) — the two 교육과정 menu items. */
  category: 'language' | 'culture'
}

/**
 * Public catalogue: programmes and their classes, read-only, filterable by
 * subject and teacher. Enrolment is handled at the institute, so the page
 * ends with its contact details rather than an apply button.
 */
export function CoursesPage({ category }: CoursesPageProps) {
  const { t } = usePreferences()
  const courses = useCourses(true)
  const [subject, setSubject] = useState<string>()
  const [teacher, setTeacher] = useState<string>()

  const inCategory = useMemo(
    () => courses.data?.filter((course) => (course.category ?? 'language') === category) ?? [],
    [courses.data, category],
  )

  // Options describe what this page actually holds, so a filter can never
  // produce an empty list by accident.
  const { subjectOptions, teacherOptions } = useMemo(() => {
    const subjects = new Set<string>()
    const teachers = new Set<string>()

    for (const course of inCategory) {
      subjects.add(course.subject)

      if (course.teacherName) {
        teachers.add(course.teacherName)
      }
    }

    const toOptions = (values: Set<string>) =>
      [...values].sort(compareNatural).map((value) => ({ value, label: value }))

    return { subjectOptions: toOptions(subjects), teacherOptions: toOptions(teachers) }
  }, [inCategory])

  const filtered = useMemo(
    () => inCategory.filter((course) => (!subject || course.subject === subject) && (!teacher || course.teacherName === teacher)),
    [inCategory, subject, teacher],
  )

  const filtersActive = Boolean(subject || teacher)

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.programmes')}
        title={t(category === 'culture' ? 'pageCopy.cultureTitle' : 'pageCopy.coursesTitle')}
        description={t(category === 'culture' ? 'pageCopy.cultureSubtitle' : 'pageCopy.coursesSubtitle')}
      />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text>{t('courses.form.subject')}</Text>
            <Select
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('courses.allSubjects')}
              value={subject}
              onChange={setSubject}
              options={subjectOptions}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text>{t('courses.form.teacher')}</Text>
            <Select
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('courses.allTeachers')}
              value={teacher}
              onChange={setTeacher}
              options={teacherOptions}
            />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{t('courses.classCount', { count: filtered.length })}</Text>
          {filtersActive ? (
            <Button
              type="link"
              icon={<SyncOutlined />}
              onClick={() => {
                setSubject(undefined)
                setTeacher(undefined)
              }}
            >
              {t('common.resetFilters')}
            </Button>
          ) : null}
        </div>
      </Card>

      <CourseGroupList
        courses={filtered}
        loading={courses.isPending}
        emptyText={filtersActive ? t('courses.emptyFiltered') : t('courses.empty')}
      />

      <Card className="surface-card portal-callout">
        <div>
          <Text strong>{t('courses.contactCalloutTitle')}</Text>
          <Text type="secondary">{t('courses.contactCalloutCopy')}</Text>
        </div>
        <div className="portal-callout__actions">
          <a href={phoneHref}>
            <Button type="primary" icon={<PhoneOutlined />}>
              {contact.phone}
            </Button>
          </a>
          <Text type="secondary">
            <EnvironmentOutlined /> {contact.address}
          </Text>
        </div>
      </Card>
    </div>
  )
}
