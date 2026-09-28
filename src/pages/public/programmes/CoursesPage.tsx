import { CloseOutlined, EnvironmentOutlined, PhoneOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Tooltip, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { CourseGroupList } from '../../../features/courses/CourseGroupList'
import { useCourses } from '../../../features/courses/queries'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

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
  const { t } = usePreferences()
  const courses = useCourses(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  const inCategory = useMemo(
    () => courses.data?.filter((course) => (course.category ?? 'language') === category) ?? [],
    [courses.data, category],
  )

  /** Class, programme, teacher and room — whatever the visitor remembers. */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return inCategory
    }

    return inCategory.filter((course) =>
      [course.subject, course.title, course.teacherName, course.classroom, course.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [inCategory, search])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearch('')
  }

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.programmes')}
        title={t(category === 'culture' ? 'pageCopy.cultureTitle' : 'pageCopy.coursesTitle')}
        description={t(category === 'culture' ? 'pageCopy.cultureSubtitle' : 'pageCopy.coursesSubtitle')}
        extra={
          searchOpen ? (
            <div className="material-search">
              <Input
                autoFocus
                allowClear
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('courses.searchPlaceholder')}
                prefix={<SearchOutlined />}
              />
              <Button type="text" icon={<CloseOutlined />} aria-label={t('common.cancel')} onClick={closeSearch} />
            </div>
          ) : (
            <Tooltip title={t('common.search')}>
              <Button
                className="icon-button"
                icon={<SearchOutlined />}
                aria-label={t('common.search')}
                onClick={() => setSearchOpen(true)}
              />
            </Tooltip>
          )
        }
      />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <CourseGroupList
        courses={filtered}
        loading={courses.isPending}
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
