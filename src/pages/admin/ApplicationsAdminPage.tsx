import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { approveApplication, getApplications, rejectApplication } from '../../features/courses/api/coursesApi'
import type { CourseApplicationRecord } from '../../types'

const { Title, Text } = Typography

export function ApplicationsAdminPage() {
  const [applications, setApplications] = useState<CourseApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getApplications()
      setApplications(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '수강 신청 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  const handleApprove = async (id: string) => {
    try {
      await approveApplication(id)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : '승인 처리에 실패했습니다.')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectApplication(id)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : '반려 처리에 실패했습니다.')
    }
  }

  const columns = [
    { title: '신청자', dataIndex: 'applicantName', key: 'applicantName' },
    { title: '이메일', dataIndex: 'applicantEmail', key: 'applicantEmail' },
    { title: '연락처', dataIndex: 'phone', key: 'phone', render: (value?: string | null) => value || '-' },
    { title: '희망 과정', dataIndex: 'course', key: 'course', render: (course?: { title?: string }) => course?.title || '-' },
    { title: '목적', dataIndex: 'goal', key: 'goal', render: (value?: string | null) => value || '-' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (value?: string | null) => {
        if (value === 'approved') return <Tag color="green">승인</Tag>
        if (value === 'rejected') return <Tag color="red">반려</Tag>
        if (value === 'enrolled') return <Tag color="blue">수강 등록</Tag>
        return <Tag color="gold">대기</Tag>
      },
    },
    {
      title: '관리',
      key: 'actions',
      render: (_: unknown, record: CourseApplicationRecord) => (
        <Space>
          <Button size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)} disabled={record.status === 'approved'}>승인</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record.id)} disabled={record.status === 'rejected'}>반려</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">ADMIN</Text>
        <Title level={1}>수강 신청 관리</Title>
        <Text>학생의 수강 신청을 검토하고 승인/반려 상태를 관리할 수 있습니다.</Text>
      </header>

      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}

      <Card className="surface-card">
        <Table className="admin-table" columns={columns} dataSource={applications} rowKey="id" pagination={{ pageSize: 10 }} loading={loading} scroll={{ x: 1200 }} />
      </Card>
    </div>
  )
}
