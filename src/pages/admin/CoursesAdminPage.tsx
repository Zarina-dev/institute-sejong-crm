import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, AutoComplete, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { SessionsEditor } from '../../features/courses/SessionsEditor'
import { courseTitles, groupCourses } from '../../features/courses/grouping'
import { formatSessions, weeklyHoursFromSessions } from '../../features/courses/sessions'
import { useCourses, useCreateCourse, useDeleteCourse, useSetCoursePublished, useUpdateCourse } from '../../features/courses/queries'
import { useAllStaff } from '../../features/staff/queries'
import type { CourseRecord, CourseSession } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type CourseFormValues = {
  category: 'language' | 'culture'
  title: string
  description?: string
  subject: string
  teacherName?: string
  sessions: CourseSession[]
  classroom?: string
  startDate?: string
  endDate?: string
  expectedStudents?: number | null
  actualStudents?: number | null
  totalHours?: number | null
  weeklyHours?: number | null
  isPublished: boolean
}

export function CoursesAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const courses = useCourses(false)
  const staff = useAllStaff()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()
  const setPublished = useSetCoursePublished()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<CourseFormValues>()
  // Once the admin types a figure we stop overwriting it; institutes count
  // teaching periods their own way and the computed hours are only a default.
  const weeklyHoursEdited = useRef(false)
  const sessions = Form.useWatch('sessions', form)

  useEffect(() => {
    if (!modalOpen || weeklyHoursEdited.current) {
      return
    }

    form.setFieldValue('weeklyHours', weeklyHoursFromSessions(sessions))
  }, [form, modalOpen, sessions])

  const saving = createCourse.isPending || updateCourse.isPending

  /* ------------------------------- modal ------------------------------ */

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    weeklyHoursEdited.current = false
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (record: CourseRecord) => {
      setEditingId(record.id)
      // An existing figure is the admin's; keep it until they clear the field.
      weeklyHoursEdited.current = record.weeklyHours != null
      form.setFieldsValue({
        category: record.category ?? 'language',
        title: record.title,
        description: record.description ?? undefined,
        subject: record.subject,
        teacherName: record.teacherName ?? undefined,
        sessions: record.sessions ?? [],
        classroom: record.classroom ?? undefined,
        startDate: record.startDate ?? undefined,
        endDate: record.endDate ?? undefined,
        expectedStudents: record.expectedStudents ?? null,
        actualStudents: record.actualStudents ?? null,
        totalHours: record.totalHours ?? null,
        weeklyHours: record.weeklyHours ?? null,
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

  /* ------------------------------ columns ----------------------------- */

  // Rows in programme order, with each programme's classes together; only
  // the first row of a programme prints its name (a real rowSpan would break
  // as soon as an expandable row opens inside the block).
  const { rows, rowSpans } = useMemo(() => {
    const groups = groupCourses(courses.data)
    const rows: CourseRecord[] = []
    const rowSpans = new Map<string, number>()

    for (const group of groups) {
      group.courses.forEach((course, index) => {
        rows.push(course)
        rowSpans.set(course.id, index === 0 ? group.courses.length : 0)
      })
    }

    return { rows, rowSpans }
  }, [courses.data])

  const titleOptions = useMemo(() => courseTitles(courses.data).map((value) => ({ value })), [courses.data])

  /**
   * Teachers come from 교직원. Names already stored on a course are kept as
   * options too, so editing an old course never silently drops its teacher.
   */
  const staffOptions = useMemo(() => {
    const names = new Set((staff.data ?? []).map((member) => member.name))

    for (const course of courses.data ?? []) {
      if (course.teacherName) {
        names.add(course.teacherName)
      }
    }

    return [...names].sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }))
  }, [courses.data, staff.data])

  const columns = useMemo<NonNullable<TableProps<CourseRecord>['columns']>>(
    () => [
      {
        title: t('courses.form.title'),
        key: 'title',
        width: 160,
        onCell: (record) => ({ className: rowSpans.get(record.id) ? 'course-programme-cell' : 'course-programme-cell course-programme-cell--continued' }),
        render: (_, record) => (rowSpans.get(record.id) ? <Text strong>{record.title}</Text> : null),
      },
      {
        title: t('courses.form.subject'),
        key: 'subject',
        render: (_, record) => (
          <div className="cell-stack">
            <Text strong>{record.subject}</Text>
            {record.category === 'culture' ? <Tag color="purple">{t('courses.form.categoryCulture')}</Tag> : null}
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
    [compactActions, handleDelete, handleTogglePublished, language, openEditModal, pinActions, rowSpans, setPublished.isPending, setPublished.variables?.id, t],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('common.admin')}
        title={t('courses.adminTitle')}
        description={t('courses.adminSubtitle')}
      />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('courses.count', { count: courses.data?.length ?? 0 })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('courses.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          // No paging: a programme's classes must stay on one page for the row span to hold.
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={courses.isPending}
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
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: false, sessions: [], category: 'language' }}>
          <Form.Item name="category" label={t('courses.form.category')}>
            <Select
              options={[
                { value: 'language', label: t('courses.form.categoryLanguage') },
                { value: 'culture', label: t('courses.form.categoryCulture') },
              ]}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              {/* Programme: pick an existing one to add a class under it, or type a new one. */}
              <Form.Item name="title" label={t('courses.form.title')} extra={t('courses.form.titleHint')} rules={[{ required: true, whitespace: true, message: t('courses.form.titleRequired') }]}>
                <AutoComplete options={titleOptions} placeholder={t('courses.form.titlePlaceholder')} maxLength={255} filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subject" label={t('courses.form.subject')} extra={t('courses.form.subjectHint')} rules={[{ required: true, whitespace: true, message: t('courses.form.subjectRequired') }]}>
                <Input placeholder={t('courses.form.subjectPlaceholder')} maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('courses.form.description')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherName" label={t('courses.form.teacher')} extra={staffOptions.length === 0 ? t('courses.form.teacherEmpty') : undefined}>
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('courses.form.teacherPlaceholder')}
                  options={staffOptions}
                  notFoundContent={t('courses.form.teacherEmpty')}
                />
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
              <Form.Item name="startDate" label={t('courses.form.startDate')} rules={[{ required: true, message: t('courses.form.startDateRequired') }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label={t('courses.form.endDate')}
                dependencies={['startDate']}
                rules={[
                  { required: true, message: t('courses.form.endDateRequired') },
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
          {/* Semester table (학사 일정): 예상수 · 실제수 · 총 시간수 · 주 시간 */}
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item name="expectedStudents" label={t('courses.form.expectedStudents')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="actualStudents" label={t('courses.form.actualStudents')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="totalHours" label={t('courses.form.totalHours')}>
                <InputNumber min={0} max={9999} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="weeklyHours" label={t('courses.form.weeklyHours')} extra={t('courses.form.weeklyHoursHint')}>
                <InputNumber
                  min={0}
                  max={168}
                  step={0.5}
                  style={{ width: '100%' }}
                  onChange={() => {
                    weeklyHoursEdited.current = true
                  }}
                />
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
