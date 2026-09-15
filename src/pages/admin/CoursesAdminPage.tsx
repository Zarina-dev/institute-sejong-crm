import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Badge, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { statusLabelKey } from '../../features/courses/applicationStatus'
import { ApplicationsTable } from '../../features/courses/ApplicationsTable'
import { SessionsEditor } from '../../features/courses/SessionsEditor'
import { formatSessions } from '../../features/courses/sessions'
import {
  useApplications,
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useSetApplicationStatus,
  useSetCoursePublished,
  useUpdateCourse,
} from '../../features/courses/queries'
import type { ApplicationStatus, CourseApplicationRecord, CourseRecord, CourseSession } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type CourseFormValues = {
  title: string
  description?: string
  subject: string
  teacherName?: string
  sessions: CourseSession[]
  classroom?: string
  startDate?: string
  endDate?: string
  isPublished: boolean
}

type CourseStats = Record<ApplicationStatus, number> & { total: number }

const emptyStats: CourseStats = { total: 0, pending: 0, approved: 0, rejected: 0, enrolled: 0 }

export function CoursesAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

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
        sessions: record.sessions ?? [],
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
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    try {
      if (editingId) {
        await updateCourse.mutateAsync({ id: editingId, payload: values })
        message.success(t('courses.updated'))
      } else {
        await createCourse.mutateAsync(values)
        message.success(t('courses.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('courses.saveFailed')))
    }
  }

  /* ------------------------------ actions ----------------------------- */

  const handleTogglePublished = useCallback(
    (record: CourseRecord) => {
      setPublished.mutate(
        { id: record.id, published: !record.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, t('courses.publishFailed'))) },
      )
    },
    [message, setPublished, t],
  )

  const handleDelete = useCallback(
    (record: CourseRecord) => {
      confirmDelete({
        target: record.title,
        note: t('courses.deleteNote'),
        onConfirm: () =>
          deleteCourse.mutateAsync(record.id).then(
            () => message.success(t('courses.deleted')),
            (err) => message.error(getErrorMessage(err, t('courses.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteCourse, message, t],
  )

  const changeApplication = useCallback(
    (application: CourseApplicationRecord, status: 'approved' | 'rejected') => {
      setApplicationStatus.mutate(
        { id: application.id, status },
        {
          onSuccess: () =>
            message.success(t('courses.statusChanged', { name: application.applicantName, status: t(statusLabelKey(status)) })),
          onError: (err) => message.error(getErrorMessage(err, t('courses.statusChangeFailed'))),
        },
      )
    },
    [message, setApplicationStatus, t],
  )

  const handleApprove = useCallback((a: CourseApplicationRecord) => changeApplication(a, 'approved'), [changeApplication])
  const handleReject = useCallback((a: CourseApplicationRecord) => changeApplication(a, 'rejected'), [changeApplication])

  /* ------------------------------ columns ----------------------------- */

  const columns = useMemo<NonNullable<TableProps<CourseRecord>['columns']>>(
    () => [
      {
        title: t('courses.columns.course'),
        key: 'title',
        render: (_, record) => (
          <div className="cell-stack">
            <Text strong>{record.title}</Text>
            <Text type="secondary">{record.subject}</Text>
          </div>
        ),
      },
      {
        title: t('courses.columns.operations'),
        key: 'scheduleInfo',
        responsive: ['md'],
        render: (_, record) => (
          <div className="cell-stack">
            <Text>{record.teacherName || '-'}</Text>
            {formatSessions(record.sessions, language, record.classroom).map((line) => (
              <Text type="secondary" key={line}>{line}</Text>
            ))}
            <Text type="secondary">
              {record.startDate || '-'} ~ {record.endDate || '-'}
            </Text>
          </div>
        ),
      },
      {
        title: t('courses.columns.enrollment'),
        key: 'enrollmentSummary',
        render: (_, record) => {
          const stats = statsByCourse.get(record.id) ?? emptyStats

          return (
            <div className="cell-stack">
              <Text strong>{t('courses.stats.total', { count: stats.total })}</Text>
              <Space size={4} wrap>
                <Tag color="gold">{t('courses.stats.pending', { count: stats.pending })}</Tag>
                <Tag color="green">{t('courses.stats.approved', { count: stats.approved })}</Tag>
                <Tag color="blue">{t('courses.stats.enrolled', { count: stats.enrolled })}</Tag>
                <Tag color="red">{t('courses.stats.rejected', { count: stats.rejected })}</Tag>
              </Space>
            </div>
          )
        },
      },
      {
        title: t('courses.columns.visibility'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 120,
        render: (value: boolean) => (
          <Tag color={value ? 'green' : 'gold'}>{value ? t('common.published') : t('common.unpublished')}</Tag>
        ),
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 120 : 260,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(record)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button
              size="small"
              icon={record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={setPublished.isPending && setPublished.variables?.id === record.id}
              onClick={() => handleTogglePublished(record)}
              aria-label={record.isPublished ? t('common.unpublish') : t('common.publish')}
            >
              {compactActions ? null : record.isPublished ? t('common.unpublish') : t('common.publish')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(record)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, language, openEditModal, pinActions, setPublished.isPending, setPublished.variables?.id, statsByCourse, t],
  )

  const expandedRowRender = useCallback(
    (record: CourseRecord) => {
      const list = applicationsByCourse.get(record.id) ?? []

      return (
        <div className="expanded-panel">
          <div className="expanded-panel-heading">
            <Text strong>{record.title}</Text>
            <Text type="secondary">{t('courses.expandedApplicants', { count: list.length })}</Text>
          </div>
          <ApplicationsTable
            applications={list}
            size="small"
            showCourse={false}
            busyId={setApplicationStatus.isPending ? setApplicationStatus.variables?.id : null}
            onApprove={handleApprove}
            onReject={handleReject}
            emptyText={t('courses.expandedEmpty')}
          />
        </div>
      )
    },
    [applicationsByCourse, handleApprove, handleReject, setApplicationStatus.isPending, setApplicationStatus.variables?.id, t],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('common.admin')}
        title={t('courses.adminTitle')}
        description={t('courses.adminSubtitle')}
        extra={
          <Badge
            status={pendingCount > 0 ? 'warning' : 'success'}
            text={pendingCount > 0 ? t('courses.pendingBadge', { count: pendingCount }) : t('courses.noPending')}
          />
        }
      />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>
            {t('courses.count', { count: courses.data?.length ?? 0 })} · {t('courses.applications', { count: applications.data?.length ?? 0 })}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('courses.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={courses.error ?? applications.error} fallback={t('courses.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={courses.data ?? []}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          loading={courses.isPending || applications.isPending}
          expandable={{ expandedRowRender }}
        />
      </Card>

      <Modal
        title={editingId ? t('courses.editTitle') : t('courses.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={760}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: false, sessions: [] }}>
          <Form.Item name="title" label={t('courses.form.title')} rules={[{ required: true, message: t('courses.form.titleRequired') }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label={t('courses.form.description')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subject" label={t('courses.form.subject')} rules={[{ required: true, message: t('courses.form.subjectRequired') }]}>
                <Input placeholder={t('courses.form.subjectPlaceholder')} maxLength={120} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="teacherName" label={t('courses.form.teacher')}>
                <Input maxLength={150} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="classroom" label={t('courses.form.classroom')}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item label={t('courses.sessions.label')} extra={t('courses.sessions.hint')}>
            <SessionsEditor disabled={saving} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label={t('courses.form.startDate')}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label={t('courses.form.endDate')}
                dependencies={['startDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value?: string) =>
                      !value || !getFieldValue('startDate') || value >= getFieldValue('startDate')
                        ? Promise.resolve()
                        : Promise.reject(new Error(t('courses.form.endBeforeStart'))),
                  }),
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isPublished" label={t('courses.form.visibility')}>
            <Select
              options={[
                { value: true, label: t('common.published') },
                { value: false, label: t('common.unpublished') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
