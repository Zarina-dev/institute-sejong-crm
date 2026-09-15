import { DownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { apiUrl } from '../../api/client'
import { useSession } from '../../auth/useSession'
import { getMaterials } from '../../features/materials/api'
import type { MaterialListResponse } from '../../features/materials/types'

const { Title, Paragraph, Text } = Typography

export function StudentMaterialsPage() {
  const session = useSession()
  const studentCourse = session?.student?.course
  const [data, setData] = useState<MaterialListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!studentCourse) {
          if (active) {
            setData(null)
            setLoading(false)
          }
          return
        }

        const response = await getMaterials({
          course: studentCourse,
          published: 'true',
          limit: 20,
          page: 1,
        })

        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : '자료를 불러오지 못했습니다.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [studentCourse])

  if (!studentCourse) {
    return (
      <div>
        <Title level={2}>자료실</Title>
        <Card className="surface-card">
          <Paragraph>현재 승인된 과정이 없어 자료실에 접근할 수 없습니다.</Paragraph>
          <Paragraph>관리자의 승인 후 해당 과정 자료가 표시됩니다.</Paragraph>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Title level={2}>자료실</Title>
      <Paragraph>승인된 과정에 속한 자료를 확인하고 다운로드할 수 있는 자료실 화면입니다.</Paragraph>
      <Paragraph>현재 접근 가능한 과정: <Text strong>{studentCourse}</Text></Paragraph>

      {error ? <Alert type="error" message={error} showIcon /> : null}

      {loading ? (
        <Text>자료를 불러오는 중입니다...</Text>
      ) : data && data.items.length > 0 ? (
        <Row gutter={[16, 16]}>
          {data.items.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.id}>
              <Card className="surface-card">
                <Title level={4}>{item.title}</Title>
                <Paragraph type="secondary">{item.description || '자료 설명이 없습니다.'}</Paragraph>
                <Text type="secondary">{item.subject} · {item.course}</Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<DownloadOutlined />} href={apiUrl(`/materials/${item.id}/download`)} target="_blank" rel="noopener noreferrer">
                    다운로드
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card">
          <Empty description="해당 과정에 공개된 자료가 없습니다." />
        </Card>
      )}
    </div>
  )
}
