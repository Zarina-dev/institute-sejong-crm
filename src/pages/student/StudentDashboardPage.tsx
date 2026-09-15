import { BookOutlined, CalendarOutlined, FolderOpenOutlined, IdcardOutlined } from '@ant-design/icons'
import { Card, Col, Row, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { useStudentEnrollments } from '../../features/courses/queries'
import { useMaterials } from '../../features/materials/queries'
import { PageHeader } from '../../shared/PageHeader'

const { Text, Paragraph } = Typography

export function StudentDashboardPage() {
  const { t } = usePreferences()
  const { session, student } = useCurrentStudent()
  const studentId = student?.id ?? session?.studentId

  // Cheap head-counts that share the cache with their own pages.
  const enrollments = useStudentEnrollments(studentId)
  const materials = useMaterials(
    { course: student?.course, published: 'true', limit: 1, page: 1 },
    { enabled: Boolean(student?.course) },
  )

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title={t('dashboard.greeting', { name: student?.name || session?.displayName || t('session.roleStudent') })}
        description={t('dashboard.subtitle')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><BookOutlined /> {t('dashboard.currentCourse')}</>} extra={<Link to="/student/enrollments">{t('common.details')}</Link>}>
            {student?.course ? (
              <>
                <Text strong>{student.course}</Text>
                <Paragraph type="secondary">
                  {enrollments.data ? t('dashboard.enrolledCount', { count: enrollments.data.length }) : '…'} ·{' '}
                  <Tag color="green">{t('dashboard.inProgress')}</Tag>
                </Paragraph>
              </>
            ) : (
              <Paragraph type="secondary">{t('dashboard.noCourse')}</Paragraph>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><FolderOpenOutlined /> {t('dashboard.materialsAccess')}</>} extra={<Link to="/student/materials">{t('common.open')}</Link>}>
            <Paragraph type="secondary">
              {student?.course
                ? materials.data
                  ? t('dashboard.materialsCount', { count: materials.data.total, course: student.course })
                  : '…'
                : t('dashboard.materialsLocked')}
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><IdcardOutlined /> {t('dashboard.myInfo')}</>} extra={<Link to="/student/profile">{t('common.viewAll')}</Link>}>
            <Paragraph>
              {t('dashboard.studentId')}: <Text strong>{student?.studentId || session?.studentId || '-'}</Text>
            </Paragraph>
            <Paragraph>
              {t('dashboard.level')}: <Text strong>{student?.level || '-'}</Text>
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><CalendarOutlined /> {t('dashboard.upcomingEvents')}</>} extra={<Link to="/student/events">{t('common.all')}</Link>}>
            <Paragraph>{t('dashboard.orientation')}</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
