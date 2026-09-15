import { Card, Col, Empty, Row, Skeleton, Typography } from 'antd'

import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { MaterialCard } from '../../features/materials/MaterialCard'
import { useMaterials } from '../../features/materials/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Paragraph, Text } = Typography

export function StudentMaterialsPage() {
  const { student } = useCurrentStudent()
  const studentCourse = student?.course

  // `enabled` skips the request for students without an approved course
  // instead of firing a query we would throw away.
  const materials = useMaterials(
    { course: studentCourse, published: 'true', limit: 20, page: 1 },
    { enabled: Boolean(studentCourse) },
  )

  if (!studentCourse) {
    return (
      <div className="page-layout">
        <PageHeader level={2} title="자료실" description="승인된 과정에 속한 자료를 확인하고 다운로드할 수 있습니다." />
        <Card className="surface-card empty-card">
          <Empty description="현재 승인된 과정이 없어 자료실에 접근할 수 없습니다. 관리자 승인 후 해당 과정 자료가 표시됩니다." />
        </Card>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title="자료실"
        description={
          <>
            현재 접근 가능한 과정: <Text strong>{studentCourse}</Text>
          </>
        }
      />

      <ErrorAlert error={materials.error} fallback="자료를 불러오지 못했습니다." />

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
          <Empty description="해당 과정에 공개된 자료가 없습니다." />
          <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
            선생님이 자료를 올리면 여기에 표시됩니다.
          </Paragraph>
        </Card>
      )}
    </div>
  )
}
