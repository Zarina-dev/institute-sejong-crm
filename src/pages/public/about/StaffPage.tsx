import { MailOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Col, Empty, Row, Skeleton, Typography } from 'antd'
import { useMemo } from 'react'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { usePublishedStaff } from '../../../features/staff/queries'
import type { StaffMember } from '../../../features/staff/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_STAFF: StaffMember[] = []

function StaffCard({ member }: { member: StaffMember }) {
  const { t } = usePreferences()
  const current = member.isCurrent !== false

  return (
    <Card className={`surface-card staff-card${current ? '' : ' is-former'}`}>
      {/* Whether they work here now, readable before anything else on the card. */}
      <span className={`staff-status${current ? ' is-current' : ''}`}>
        <span className="staff-status__dot" aria-hidden="true" />
        {current ? t('staff.current') : t('staff.former')}
      </span>

      <div className="staff-card__head">
        <Avatar size={72} src={member.photoUrl ? assetUrl(member.photoUrl) : undefined} icon={<UserOutlined />} alt="" />
        <div>
          <Title level={3}>{member.name}</Title>
          <Text className="staff-card__position">{member.position}</Text>
        </div>
      </div>
      {member.bio ? <Paragraph className="staff-card__bio">{member.bio}</Paragraph> : null}
      {/* A former colleague's address is no longer how to reach the institute. */}
      {member.email && current ? (
        <a className="staff-card__email" href={`mailto:${member.email}`}>
          <MailOutlined /> {member.email}
        </a>
      ) : null}
    </Card>
  )
}

function StaffGrid({ members }: { members: StaffMember[] }) {
  return (
    <Row gutter={[18, 18]} className="card-grid">
      {members.map((member) => (
        <Col xs={24} sm={12} lg={8} key={member.id}>
          <StaffCard member={member} />
        </Col>
      ))}
    </Row>
  )
}

/**
 * 강사 소개 — the teachers and administrators, managed at /admin/staff.
 * Those working here now come first, each card saying so; those who have
 * left follow under their own heading, because who taught here is part of
 * the institute's record — but a visitor must not mistake them for current.
 */
export function StaffPage() {
  const { t } = usePreferences()
  const staff = usePublishedStaff()
  const members = staff.data ?? NO_STAFF

  const current = useMemo(() => members.filter((member) => member.isCurrent !== false), [members])
  const former = useMemo(() => members.filter((member) => member.isCurrent === false), [members])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('pageCopy.staffTitle')} description={t('pageCopy.staffSubtitle')} />

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
      ) : members.length > 0 ? (
        <div className="course-groups">
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
