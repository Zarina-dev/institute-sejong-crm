import { CalendarOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Col, Empty, Row, Skeleton, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { usePublishedStaff } from '../../../features/staff/queries'
import { staffStatus, type StaffStatus } from '../../../features/staff/status'
import type { StaffMember } from '../../../features/staff/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { HeaderSearch, matchesQuery } from '../../../shared/HeaderSearch'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_STAFF: StaffMember[] = []

const STATUS_LABEL = { current: 'staff.current', upcoming: 'staff.upcoming', former: 'staff.former' } as const

function StaffCard({ member, status }: { member: StaffMember; status: StaffStatus }) {
  const { t, language } = usePreferences()

  // "2013년 9월 1일 ~ 현재", "~ 2015년 12월 31일", "2026년 11월 1일 입사 예정".
  const period =
    status === 'upcoming' && member.startDate
      ? t('staff.joinsOn', { date: formatDate(member.startDate, language) })
      : member.startDate
        ? `${formatDate(member.startDate, language)} ~ ${member.endDate ? formatDate(member.endDate, language) : t('staff.toPresent')}`
        : null

  return (
    <Card className="surface-card staff-card">
      {/* Whether they work here, readable before anything else on the card. */}
      <span className={`staff-status is-${status}`}>
        <span className="staff-status__dot" aria-hidden="true" />
        {t(STATUS_LABEL[status])}
      </span>

      <div className="staff-card__head">
        <Avatar size={72} src={member.photoUrl ? assetUrl(member.photoUrl) : undefined} icon={<UserOutlined />} alt="" />
        <div>
          <Title level={3}>{member.name}</Title>
          <Text className="staff-card__position">{member.position}</Text>
        </div>
      </div>
      {period ? (
        <Text type="secondary" className="staff-card__period">
          <CalendarOutlined /> {period}
        </Text>
      ) : null}
      {member.bio ? <Paragraph className="staff-card__bio">{member.bio}</Paragraph> : null}
      {/* A former colleague's address is no longer how to reach the institute. */}
      {member.email && status !== 'former' ? (
        <a className="staff-card__email" href={`mailto:${member.email}`}>
          <MailOutlined /> {member.email}
        </a>
      ) : null}
    </Card>
  )
}

function StaffGrid({ members }: { members: Array<{ member: StaffMember; status: StaffStatus }> }) {
  return (
    <Row gutter={[18, 18]} className="card-grid">
      {members.map(({ member, status }) => (
        <Col xs={24} sm={12} lg={8} key={member.id}>
          <StaffCard member={member} status={status} />
        </Col>
      ))}
    </Row>
  )
}

/**
 * 강사 소개 — the teachers and administrators, managed at /admin/staff.
 * Those working here, and those about to join, come first; those who have
 * left follow under their own heading — who taught here is part of the
 * institute's record, so they stay, plainly marked rather than faded out.
 * Each status is read off the member's dates, so it turns over by itself.
 */
export function StaffPage() {
  const { t } = usePreferences()
  const staff = usePublishedStaff()
  const members = staff.data ?? NO_STAFF
  const [search, setSearch] = useState('')

  // Name, position, introduction — whatever the visitor remembers.
  const withStatus = useMemo(
    () =>
      members
        .filter((member) => matchesQuery(search, [member.name, member.position, member.bio, member.email]))
        .map((member) => ({ member, status: staffStatus(member) })),
    [members, search],
  )
  const searching = search.trim().length > 0
  const current = useMemo(() => withStatus.filter((entry) => entry.status !== 'former'), [withStatus])
  const former = useMemo(() => withStatus.filter((entry) => entry.status === 'former'), [withStatus])

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.about')}
        title={t('pageCopy.staffTitle')}
        description={t('pageCopy.staffSubtitle')}
        extra={members.length > 0 ? <HeaderSearch value={search} onChange={setSearch} placeholder={t('staff.searchPlaceholder')} /> : null}
      />

      <ErrorAlert error={staff.error} fallback={t('staff.loadFailed')} />

      {staff.isPending ? (
        <Row gutter={[18, 18]} className="card-grid">
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card className="surface-card staff-card">
                <Skeleton active avatar={{ size: 72, shape: 'circle' }} paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : members.length > 0 && searching && withStatus.length === 0 ? (
        <Card className="surface-card empty-card">
          <Empty description={t('common.noMatches', { query: search.trim() })} />
        </Card>
      ) : members.length > 0 ? (
        <div className="course-groups">
          {searching && current.length === 0 ? null : (
            <section className="course-group" aria-labelledby="staff-current">
              <div className="course-group__heading">
                <Title level={2} id="staff-current">
                  {t('staff.currentHeading')}
                </Title>
                <Text type="secondary">{t('staff.count', { count: current.length })}</Text>
              </div>
              {current.length > 0 ? (
                <StaffGrid members={current} />
              ) : (
                <Card className="surface-card empty-card">
                  <Empty description={t('about.staffEmpty')} />
                </Card>
              )}
            </section>
          )}

          {former.length > 0 ? (
            <section className="course-group" aria-labelledby="staff-former">
              <div className="course-group__heading">
                <Title level={2} id="staff-former">
                  {t('staff.formerHeading')}
                </Title>
                <Text type="secondary">{t('staff.count', { count: former.length })}</Text>
              </div>
              <StaffGrid members={former} />
            </section>
          ) : null}
        </div>
      ) : staff.error ? null : (
        <Card className="surface-card empty-card">
          <Empty description={t('about.staffEmpty')} />
        </Card>
      )}
    </div>
  )
}
