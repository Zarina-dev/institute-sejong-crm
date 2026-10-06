import { EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { CourseGroupList } from '../../../features/courses/CourseGroupList'
import { useCourses, useCourseTermCounts } from '../../../features/courses/queries'
import type { CourseRecord } from '../../../features/courses/types'
import { useTerms } from '../../../features/terms/queries'
import { TermPicker } from '../../../features/terms/TermPicker'
import type { AcademicTerm } from '../../../features/terms/types'
import { useTermChoice } from '../../../features/terms/useTermChoice'
import { HeaderSearch, matchesQuery } from '../../../shared/HeaderSearch'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

const NO_COURSES: CourseRecord[] = []
const NO_TERMS: AcademicTerm[] = []

type CoursesPageProps = {
  /** 강좌 안내 (language) or 문화 강좌 (culture) — the two 교육과정 menu items. */
  category: 'language' | 'culture'
}

/**
 * Public catalogue: programmes and their classes, read-only. The list is
 * short enough to read as it is, so instead of a filter bar the header
 * carries one magnifier — the same as 학습 보조 자료. Enrolment happens at the
 * institute, so the page ends with its contact details.
 */
export function CoursesPage({ category }: CoursesPageProps) {
  const { t, language } = usePreferences()
  const [search, setSearch] = useState('')

  /**
   * One semester at a time — the one in progress unless the visitor picks
   * another — and only this page's category. Without that, every class the
   * institute ever ran would be listed here, and downloaded to do it.
   */
  const terms = useTerms()
  const defined = terms.data ?? NO_TERMS
  const { active, select } = useTermChoice(defined)
  const courses = useCourses(true, { term: active?.code, category }, !terms.isPending)
  // Semesters this list has nothing in are greyed out in the picker.
  const counts = useCourseTermCounts(true, category)

  const inCategory = courses.data ?? NO_COURSES

  /** Class, programme, teacher and room — whatever the visitor remembers. */
  const filtered = useMemo(() => {
    return inCategory.filter((course) =>
      matchesQuery(search, [course.subject, course.title, course.teacherName, course.classroom, course.description]),
    )
  }, [inCategory, search])

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.programmes')}
        title={t(category === 'culture' ? 'pageCopy.cultureTitle' : 'pageCopy.coursesTitle')}
        description={t(category === 'culture' ? 'pageCopy.cultureSubtitle' : 'pageCopy.coursesSubtitle')}
        extra={<HeaderSearch value={search} onChange={setSearch} placeholder={t('courses.searchPlaceholder')} />}
      />

      <ErrorAlert error={courses.error ?? terms.error} fallback={t('courses.loadFailed')} />

      {/* The same semester picker as 학사 일정, so both open on the same term. */}
      {defined.length > 0 ? (
        <Card className="surface-card filter-card">
          <div className="filter-footer">
            <TermPicker terms={defined} active={active} onSelect={select} counts={counts.data} emptyHint={t('terms.noClasses')} />

            {active ? (
              <Text type="secondary">
                {formatDate(active.startDate, language)} ~ {formatDate(active.endDate, language)} ·{' '}
                {t('courses.classCount', { count: inCategory.length })}
              </Text>
            ) : null}
          </div>
        </Card>
      ) : null}

      <CourseGroupList
        courses={filtered}
        loading={courses.isPending || terms.isPending}
        emptyText={search ? t('courses.emptyFiltered') : t('courses.empty')}
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
