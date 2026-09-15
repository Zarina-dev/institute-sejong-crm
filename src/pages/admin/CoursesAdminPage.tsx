import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { approveApplication, createCourse, deleteCourse, getApplications, getCourses, publishCourse, rejectApplication, unpublishCourse, updateCourse } from '../../features/courses/api'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import type { CourseApplicationRecord, CourseRecord } from '../../features/courses/types'

const { Title, Text } = Typography

export function CoursesAdminPage() {
  const confirmDelete = useConfirmDelete()
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [applications, setApplications] = useState<CourseApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const loadCourses = async () => {
    setLoading(true)
    setError(null)

    try {
      const [courseResponse, applicationResponse] = await Promise.all([
        getCourses(false),
        getApplications(),
      ])

      setCourses(courseResponse)
      setApplications(applicationResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : '과정/신청 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourses()
  }, [])

  const openCreateModal = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: CourseRecord) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      subject: record.subject,
      teacherName: record.teacherName,
      schedule: record.schedule,
      classroom: record.classroom,
      startDate: record.startDate,
      endDate: record.endDate,
      isPublished: record.isPublished,
    })
    setModalOpen(true)
  }

  const submitForm = async () => {
    const values = await form.validateFields()

    try {
      if (editingId) {
        await updateCourse(editingId, values)
      } else {
        await createCourse(values)
      }

      setModalOpen(false)
      form.resetFields()
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '과정 저장에 실패했습니다.')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishCourse(id)
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '과정 공개 처리에 실패했습니다.')
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishCourse(id)
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '과정 공개 취소에 실패했습니다.')
    }
  }

  const handleDelete = (record: CourseRecord) => {
    confirmDelete({
      target: record.title,
      // Both relations are ON DELETE CASCADE on the backend.
      note: '이 과정의 수강 신청과 수강 등록 기록도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.',
      onConfirm: async () => {
        try {
          await deleteCourse(record.id)
          await loadCourses()
        } catch (err) {
          setError(err instanceof Error ? err.message : '과정 삭제에 실패했습니다.')
        }
      },
    })
  }

  const handleApprove = async (id: string) => {
    try {
      await approveApplication(id)
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '승인 처리에 실패했습니다.')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectApplication(id)
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : '반려 처리에 실패했습니다.')
    }
  }

  const courseStats = courses.reduce<Record<string, { total: number; pending: number; approved: number; rejected: number; enrolled: number }>>(
    (accumulator, course) => {
      const matchingApplications = applications.filter((application) => application.courseId === course.id)

      accumulator[course.id] = {
        total: matchingApplications.length,
        pending: matchingApplications.filter((application) => application.status === 'pending').length,
        approved: matchingApplications.filter((application) => application.status === 'approved').length,
        rejected: matchingApplications.filter((application) => application.status === 'rejected').length,
        enrolled: matchingApplications.filter((application) => application.status === 'enrolled').length,
      }

      return accumulator
    },
    {},
  )

  const getCourseApplications = (courseId: string) =>
    applications.filter((application) => application.courseId === courseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const columns = [
    {
      title: '수강명',
      key: 'title',
      render: (_: unknown, record: CourseRecord) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text strong>{record.title}</Text>
          <Text type="secondary">{record.subject}</Text>
        </div>
      ),
    },
    {
      title: '운영 정보',
      key: 'scheduleInfo',
      render: (_: unknown, record: CourseRecord) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text>{record.teacherName || '-'}</Text>
          <Text type="secondary">{record.schedule || '-'} · {record.classroom || '-'}</Text>
          <Text type="secondary">{record.startDate || '-'} ~ {record.endDate || '-'}</Text>
        </div>
      ),
    },
    {
      title: '수강 상태',
      key: 'enrollmentSummary',
      render: (_: unknown, record: CourseRecord) => {
        const stats = courseStats[record.id] ?? { total: 0, pending: 0, approved: 0, rejected: 0, enrolled: 0 }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text strong>총 {stats.total}명</Text>
            <Space size={4} wrap>
              <Tag color="gold">대기 {stats.pending}</Tag>
              <Tag color="green">승인 {stats.approved}</Tag>
              <Tag color="blue">수강 {stats.enrolled}</Tag>
              <Tag color="red">반려 {stats.rejected}</Tag>
            </Space>
          </div>
        )
      },
    },
    {
      title: '공개 상태',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (value: boolean) => <Tag color={value ? 'green' : 'gold'}>{value ? '공개' : '비공개'}</Tag>,
    },
    {
      title: '관리',
      key: 'actions',
      render: (_: unknown, record: CourseRecord) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)} icon={<EditOutlined />}>수정</Button>
          {record.isPublished ? (
            <Button size="small" onClick={() => handleUnpublish(record.id)} icon={<EyeInvisibleOutlined />}>숨김</Button>
          ) : (
            <Button size="small" onClick={() => handlePublish(record.id)} icon={<EyeOutlined />}>공개</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>삭제</Button>
        </Space>
      ),
    },
  ]

  const hasPendingApplications = applications.some((application) => application.status === 'pending')

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">ADMIN</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={1} style={{ margin: 0 }}>수강 관리</Title>
          <span
            title={hasPendingApplications ? '새로운 수강 신청이 있습니다.' : '새로운 신청 업데이트가 없습니다.'}
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: hasPendingApplications ? '#f59e0b' : '#22c55e',
              boxShadow: hasPendingApplications ? '0 0 0 3px rgba(245, 158, 11, 0.22)' : '0 0 0 3px rgba(34, 197, 94, 0.18)',
            }}
          />
        </div>
        <Text>수강 과정의 공개 여부, 일정, 담당교수 정보를 관리하고 학생 신청 상태를 한눈에 확인할 수 있습니다.</Text>
      </header>

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>
            {courses.length}개의 과정 · 신청 학생 {applications.length}명
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>과정 추가</Button>
        </div>
      </Card>

      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={courses}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          loading={loading}
          expandable={{
            expandedRowRender: (record: CourseRecord) => {
              const courseApplications = getCourseApplications(record.id)

              return (
                <div style={{ padding: '8px 8px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>{record.title}</Text>
                    <Text type="secondary">신청 학생 {courseApplications.length}명</Text>
                  </div>

                  <Table
                    size="small"
                    bordered={false}
                    columns={[
                      { title: '신청자', dataIndex: 'applicantName', key: 'applicantName' },
                      { title: '학생 ID', dataIndex: 'student', key: 'studentId', render: (student?: { studentId?: string } | null) => student?.studentId || '-' },
                      { title: '이메일', dataIndex: 'applicantEmail', key: 'applicantEmail' },
                      { title: '연락처', dataIndex: 'phone', key: 'phone', render: (value?: string | null) => value || '-' },
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
                        render: (_: unknown, application: CourseApplicationRecord) => (
                          <Space size="small">
                            <Button size="small" icon={<CheckOutlined />} onClick={() => void handleApprove(application.id)} disabled={application.status === 'approved'}>승인</Button>
                            <Button size="small" danger icon={<CloseOutlined />} onClick={() => void handleReject(application.id)} disabled={application.status === 'rejected'}>반려</Button>
                          </Space>
                        ),
                      },
                    ]}
                    dataSource={courseApplications}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: '아직 신청한 학생이 없습니다.' }}
                    style={{ background: '#fff' }}
                  />
                </div>
              )
            },
          }}
        />
      </Card>

      <Modal
        title={editingId ? '수강 수정' : '수강 추가'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? '저장' : '추가'}
        cancelText="취소"
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="과정명" rules={[{ required: true, message: '과정명을 입력하세요.' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="설명">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subject" label="과목" rules={[{ required: true, message: '과목을 입력하세요.' }]}>
                <Input placeholder="예: 한국어 1" />
              </Form.Item>
            </Col>
            <Col span={12} />
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherName" label="강사">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedule" label="시간표">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="classroom" label="강의실">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12} />
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="시작일">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="종료일">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isPublished" label="공개 여부" initialValue={false}>
            <Select options={[{ value: true, label: '공개' }, { value: false, label: '비공개' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
