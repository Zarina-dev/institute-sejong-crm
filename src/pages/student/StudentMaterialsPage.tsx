import { Card, Col, Empty, Row, Skeleton, Typography } from 'antd'

import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { MaterialCard } from '../../features/materials/MaterialCard'
import { useMaterials } from '../../features/materials/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Paragraph, Text } = Typography

export function StudentMaterialsPage() {
  const { t } = usePreferences()
  const { student } = useCurrentStudent()
  const studentCourse = student?.course

  const materials = useMaterials(
    { course: studentCourse, published: 'true', limit: 20, page: 1 },
    { enabled: Boolean(studentCourse) },
  )

  if (!studentCourse) {
    return (
      <div className="page-layout">
        <PageHeader level={2} title={t('materials.student.title')} description={t('materials.student.subtitle')} />
        <Card className="surface-card empty-card">
          <Empty description={t('materials.student.locked')} />
        </Card>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title={t('materials.student.title')}
        description={
          <>
            {t('materials.student.currentCourse')}: <Text strong>{studentCourse}</Text>
          </>
        }
      />

      <ErrorAlert error={materials.error} fallback={t('materials.loadFailed')} />

      {materials.isPending ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }, (_, index) => (
            <Col xs={24} md={12} xl={6} key={index}>
              <Card className="surface-card material-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : materials.data && materials.data.items.length > 0 ? (
        <Row gutter={[16, 16]}>
          {materials.data.items.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.id}>
              <MaterialCard item={item} />
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('materials.student.empty')} />
          <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
            {t('materials.student.emptyHint')}
          </Paragraph>
        </Card>
      )}
    </div>
  )
}
