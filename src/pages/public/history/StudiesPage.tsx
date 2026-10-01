import { BankOutlined, ReadOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Empty, Skeleton, Tag, Typography } from 'antd'
import { useMemo } from 'react'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { useStudies } from '../../../features/studies/queries'
import type { StudyAbroad } from '../../../features/studies/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Text } = Typography

const NO_STUDENTS: StudyAbroad[] = []

function StudentCard({ student, number }: { student: StudyAbroad; number: number }) {
  return (
    <Card className="surface-card study-card">
      <span className="study-card__number">{number}</span>

      <div className="study-card__photo">
        {student.photo ? <img src={assetUrl(student.photo)} alt="" loading="lazy" /> : <UserOutlined />}
      </div>

      <Title level={3}>{student.name}</Title>

      <ul className="study-card__facts">
        {student.university ? (
          <li>
            <BankOutlined /> {student.university}
          </li>
        ) : null}
        {student.major ? (
          <li>
            <ReadOutlined /> {student.major}
          </li>
        ) : null}
        {student.duration ? (
          <li>
            <SolutionOutlined /> {student.duration}
          </li>
        ) : null}
      </ul>

      {student.programme ? <Tag className="study-card__programme">{student.programme}</Tag> : null}
      {student.note ? (
        <Text type="secondary" className="study-card__note">
          {student.note}
        </Text>
      ) : null}
    </Card>
  )
}

/**
 * 한국 유학 현황 — everyone the institute has sent to Korea, read the way it
 * keeps the list: from the first student onwards, year by year, so someone
 * registered today joins the end rather than displacing the record. The
 * number on each card is the position in that list.
 */
export function StudiesPage() {
  const { t } = usePreferences()
  const studies = useStudies()
  const students = studies.data ?? NO_STUDENTS

  /** The API already sorts oldest first; the years are read off that order. */
  const years = useMemo(() => {
    const byYear = new Map<number, Array<{ student: StudyAbroad; number: number }>>()

    students.forEach((student, index) => {
      const entries = byYear.get(student.year) ?? []
      entries.push({ student, number: index + 1 })
      byYear.set(student.year, entries)
    })

    return [...byYear.entries()]
  }, [students])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('studies.title')} description={t('studies.subtitle')} />

      <ErrorAlert error={studies.error} fallback={t('studies.loadFailed')} />

      {studies.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : students.length > 0 ? (
        <>
          <Card className="surface-card filter-card">
            <div className="filter-footer">
              <Text type="secondary">{t('studies.count', { count: students.length })}</Text>
              <Text type="secondary">{t('studies.range', { from: years[0][0], to: years[years.length - 1][0] })}</Text>
            </div>
          </Card>

          <div className="study-years">
            {years.map(([year, entries]) => (
              <section className="study-year" key={year}>
                <h2 className="study-year__label">{t('studies.yearLabel', { year })}</h2>

                <div className="study-year__cards">
                  {entries.map(({ student, number }) => (
                    <StudentCard student={student} number={number} key={student.id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('studies.empty')} />
        </Card>
      )}
    </div>
  )
}
