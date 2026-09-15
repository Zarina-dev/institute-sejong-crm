import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Badge, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { ApplicationsTable } from '../../features/courses/ApplicationsTable'
import { applicationStatusMeta } from '../../features/courses/applicationStatus'
import {
  useApplications,
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useSetApplicationStatus,
  useSetCoursePublished,
  useUpdateCourse,
} from '../../features/courses/queries'
import type { ApplicationStatus, CourseApplicationRecord, CourseRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'

const { Text } = Typography

type CourseFormValues = {
  title: string
  description?: string
  subject: string
  teacherName?: string
  schedule?: string
  classroom?: string
  startDate?: string
  endDate?: string
  isPublished: boolean
}

type CourseStats = Record<ApplicationStatus, number> & { total: number }

const emptyStats: CourseStats = { total: 0, pending: 0, approved: 0, rejected: 0, enrolled: 0 }

export function CoursesAdminPage() {
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()

  const courses = useCourses(false)
  const applications = useApplications()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()
  const setPublished = useSetCoursePublished()
  const setApplicationStatus = useSetApplicationStatus()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<CourseFormValues>()

  const saving = createCourse.isPending || updateCourse.isPending

  /* --------------------------- derived data --------------------------- */

  // Group once per applications list, instead of filtering the full list
  // again for every row and every expanded panel.
  const { applicationsByCourse, statsByCourse, pendingCount } = useMemo(() => {
    const byCourse = new Map<string, CourseApplicationRecord[]>()
    const stats = new Map<string, CourseStats>()
    let pending = 0

    for (const application of applications.data ?? []) {
      const status = application.status ?? 'pending'
      const list = byCourse.get(application.courseId) ?? []
      list.push(application)
      byCourse.set(application.courseId, list)

      const current = stats.get(application.courseId) ?? { ...emptyStats }
      current.total += 1
      current[status] += 1
      stats.set(application.courseId, current)

      if (status === 'pending') {
        pending += 1
      }
    }

    for (const list of byCourse.values()) {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    return { applicationsByCourse: byCourse, statsByCourse: stats, pendingCount: pending }
  }, [applications.data])

  /* ------------------------------- modal ------------------------------ */

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (record: CourseRecord) => {
      setEditingId(record.id)
      form.setFieldsValue({
        title: record.title,
        description: record.description ?? undefined,
        subject: record.subject,
        teacherName: record.teacherName ?? undefined,
        schedule: record.schedule ?? undefined,
        classroom: record.classroom ?? undefined,
        startDate: record.startDate ?? undefined,
        endDate: record.endDate ?? undefined,
        isPublished: record.isPublished,
      })
      setModalOpen(true)
    },
    [form],
  )

  const submitForm = async () => {
    const values = await form.validateFields()

    try {
      if (editingId) {
        await updateCourse.mutateAsync({ id: editingId, payload: values })
        message.success('과정이 수정되었습니다.')
      } else {
        await createCourse.mutateAsync(values)
        message.success('과정이 추가되었습니다.')
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, '과정 저장에 실패했습니다.'))
    }
  }

  /* ------------------------------ actions ----------------------------- */

  const handleTogglePublished = useCallback(
    (record: CourseRecord) => {
      setPublished.mutate(
        { id: record.id, published: !record.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, '공개 상태 변경에 실패했습니다.')) },
      )
    },
    [message, setPublished],
  )

  const handleDelete = useCallback(
    (record: CourseRecord) => {
      confirmDelete({
        target: record.title,
        // Both relations are ON DELETE CASCADE on the backend.
        note: '이 과정의 수강 신청과 수강 등록 기록도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.',
        onConfirm: () =>
          deleteCourse.mutateAsync(record.id).then(
            () => message.success('삭제되었습니다.'),
            (err) => message.error(getErrorMessage(err, '과정 삭제에 실패했습니다.')),
          ),
      })
    },
    [confirmDelete, deleteCourse, message],
  )

  const changeApplication = useCallback(
    (application: CourseApplicationRecord, status: 'approved' | 'rejected') => {
      setApplicationStatus.mutate(
        { id: application.id, status },
        {
          onSuccess: () => message.success(`${application.applicantName} — ${applicationStatusMeta[status].label} 처리되었습니다.`),
          onError: (err) => message.error(getErrorMessage(err, '상태 변경에 실패했습니다.')),
        },
      )
    },
    [message, setApplicationStatus],
  )

  const handleApprove = useCallback((a: CourseApplicationRecord) => changeApplication(a, 'approved'), [changeApplication])
  const handleReject = useCallback((a: CourseApplicationRecord) => changeApplication(a, 'rejected'), [changeApplication])

  /* ------------------------------ columns ----------------------------- */

  const columns = useMemo<NonNullable<TableProps<CourseRecord>['columns']>>(
    () => [
      {
        title: '수강명',
        key: 'title',
        render: (_, record) => (
          <div className="cell-stack">
            <Text strong>{record.title}</Text>
            <Text type="secondary">{record.subject}</Text>
          </div>
        ),
      },
      {
        title: '운영 정보',
        key: 'scheduleInfo',
        render: (_, record) => (
          <div className="cell-stack">
            <Text>{record.teacherName || '-'}</Text>
            <Text type="secondary">
              {record.schedule || '-'} · {record.classroom || '-'}
            </Text>
            <Text type="secondary">
              {record.startDate || '-'} ~ {record.endDate || '-'}
            </Text>
          </div>
        ),
      },
      {
        title: '수강 상태',
        key: 'enrollmentSummary',
        render: (_, record) => {
          const stats = statsByCourse.get(record.id) ?? emptyStats

          return (
            <div className="cell-stack">
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
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'gold'}>{value ? '공개' : '비공개'}</Tag>,
      },
      {
        title: '관리',
        key: 'actions',
        width: 260,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              수정
            </Button>
            <Button
              size="small"
              icon={record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={setPublished.isPending && setPublished.variables?.id === record.id}
              onClick={() => handleTogglePublished(record)}
            >
              {record.isPublished ? '숨김' : '공개'}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              삭제
            </Button>
          </Space>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, openEditModal, setPublished.isPending, setPublished.variables?.id, statsByCourse],
  )

  const expandedRowRender = useCallback(
    (record: CourseRecord) => {
      const list = applicationsByCourse.get(record.id) ?? []

      return (
        <div className="expanded-panel">
          <div className="expanded-panel-heading">
            <Text strong>{record.title}</Text>
            <Text type="secondary">신청 학생 {list.length}명</Text>
          </div>
          <ApplicationsTable
            applications={list}
            size="small"
            showCourse={false}
            busyId={setApplicationStatus.isPending ? setApplicationStatus.variables?.id : null}
            onApprove={handleApprove}
            onReject={handleReject}
            emptyText="아직 신청한 학생이 없습니다."
          />
        </div>
      )
    },
    [applicationsByCourse, handleApprove, handleReject, setApplicationStatus.isPending, setApplicationStatus.variables?.id],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout">
      <PageHeader
        kicker="ADMIN"
        title="수강 관리"
        description="수강 과정의 공개 여부, 일정, 담당교수 정보를 관리하고 학생 신청 상태를 한눈에 확인할 수 있습니다."
        extra={
          <Badge
            status={pendingCount > 0 ? 'warning' : 'success'}
            text={pendingCount > 0 ? `대기 중 신청 ${pendingCount}건` : '새로운 신청 없음'}
          />
        }
      />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>
            {courses.data?.length ?? 0}개의 과정 · 신청 {applications.data?.length ?? 0}건
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            과정 추가
          </Button>
        </div>
      </Card>

      <ErrorAlert error={courses.error ?? applications.error} fallback="과정/신청 정보를 불러오지 못했습니다." />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={courses.data ?? []}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1100 }}
          loading={courses.isPending || applications.isPending}
          expandable={{ expandedRowRender }}
        />
      </Card>

      <Modal
        title={editingId ? '수강 수정' : '수강 추가'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? '저장' : '추가'}
        cancelText="취소"
        confirmLoading={saving}
        destroyOnHidden
        width={760}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: false }}>
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
            <Col span={12}>
              <Form.Item name="teacherName" label="강사">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schedule" label="시간표">
                <Input placeholder="예: 월·수 10:00–11:30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classroom" label="강의실">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="시작일">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="종료일"
                dependencies={['startDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value?: string) =>
                      !value || !getFieldValue('startDate') || value >= getFieldValue('startDate')
                        ? Promise.resolve()
                        : Promise.reject(new Error('종료일은 시작일 이후여야 합니다.')),
                  }),
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isPublished" label="공개 여부">
            <Select
              options={[
                { value: true, label: '공개' },
                { value: false, label: '비공개' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
