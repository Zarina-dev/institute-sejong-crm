import { MailOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Col, Empty, Row, Skeleton, Typography } from 'antd'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { usePublishedStaff } from '../../../features/staff/queries'
import type { StaffMember } from '../../../features/staff/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_STAFF: StaffMember[] = []

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <Card className="surface-card staff-card">
      <Avatar size={112} src={member.photoUrl ? assetUrl(member.photoUrl) : undefined} icon={<UserOutlined />} alt="" />
      <Title level={3}>{member.name}</Title>
      <Text className="staff-card__position">{member.position}</Text>
      {member.bio ? <Paragraph className="staff-card__bio">{member.bio}</Paragraph> : null}
      {member.email ? (
        <a className="staff-card__email" href={`mailto:${member.email}`}>
          <MailOutlined /> {member.email}
        </a>
      ) : null}
    </Card>
  )
}

/** 강사 소개 — the teachers and administrators, managed at /admin/staff. */
export function StaffPage() {
  const { t } = usePreferences()
  const staff = usePublishedStaff()
  const members = staff.data ?? NO_STAFF

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('pageCopy.staffTitle')} description={t('pageCopy.staffSubtitle')} />

      <ErrorAlert error={staff.error} fallback={t('staff.loadFailed')} />

      {staff.isPending ? (
        <Row gutter={[18, 18]}>
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card className="surface-card staff-card">
                <Skeleton active avatar={{ size: 112, shape: 'circle' }} paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : members.length > 0 ? (
        <Row gutter={[18, 18]}>
          {members.map((member) => (
            <Col xs={24} sm={12} lg={8} key={member.id}>
              <StaffCard member={member} />
            </Col>
          ))}
        </Row>
      ) : staff.error ? null : (
        <Card className="surface-card empty-card">
          <Empty description={t('about.staffEmpty')} />
        </Card>
      )}
    </div>
  )
}