import { UserOutlined } from '@ant-design/icons'
import { Card, Empty, Skeleton, Typography } from 'antd'
import { useMemo } from 'react'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { useStudies } from '../../../features/studies/queries'
import { otherName, studyText } from '../../../features/studies/text'
import type { StudyAbroad } from '../../../features/studies/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Text } = Typography

const NO_STUDENTS: StudyAbroad[] = []

/**
 * One student. Every text is shown in the reader's language, falling back to
 * the other one; the name also carries its other script underneath —
 * 아지모바 굴잔 / Азимова Гулжан — since that is how both readers know them.
 *
 * The card has one fixed structure whatever the language: portrait and name
 * side by side, then label | value rows. A long Kyrgyz value
 * ("Информациялык коммуникациялык инженерия") wraps inside its value
 * column instead of reflowing the whole card, so a row of cards reads the
 * same in Korean, Kyrgyz or any mix of the two.
 */
function StudentCard({ student, number }: { student: StudyAbroad; number: number }) {
  const { t, language } = usePreferences()
  const text = (field: Parameters<typeof studyText>[1]) => studyText(student, field, language)
  const alias = otherName(student, language)

  const facts = [
    { label: t('studies.form.university'), value: text('university') },
    { label: t('studies.form.major'), value: text('major') },
    { label: t('studies.form.duration'), value: text('duration') },
    { label: t('studies.form.programme'), value: text('programme') },
  ].filter((fact) => fact.value)
  const note = text('note')

  return (
    <Card className="surface-card study-card">
      <div className="study-card__head">
        <div className="study-card__photo">
          {student.photo ? <img src={assetUrl(student.photo)} alt="" loading="lazy" /> : <UserOutlined />}
        </div>

        <div className="study-card__names">
          <span className="study-card__number">{number}</span>
          <Title level={3}>{text('name')}</Title>
          {alias ? <Text className="study-card__alias">{alias}</Text> : null}
        </div>
      </div>

      {facts.length > 0 ? (
        <dl className="study-card__facts">
          {facts.map((fact) => (
            <div className="study-card__fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {note ? <Text className="study-card__note">{note}</Text> : null}
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
