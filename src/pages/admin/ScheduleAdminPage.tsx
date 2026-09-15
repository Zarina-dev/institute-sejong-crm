import { DeleteOutlined, EditOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useCatalog } from '../../features/catalog/useCatalog'
import { useCreateScheduleEntry, useDeleteScheduleEntry, useSchedule, useUpdateScheduleEntry } from '../../features/schedule/queries'
import type { ScheduleEntry } from '../../features/schedule/types'
import { addDays, formatWeekLabel, startOfWeek, toIsoDate, weekRange } from '../../features/schedule/week'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type ScheduleFormValues = {
  date: string
  startTime: string
  endTime: string
  subject: string
  teacher?: string
  classroom?: string
  courseGroup?: string
}

export function ScheduleAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const catalog = useCatalog()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const range = useMemo(() => weekRange(monday), [monday])
  const schedule = useSchedule(range)
  const createEntry = useCreateScheduleEntry()
  const updateEntry = useUpdateScheduleEntry()
  const deleteEntry = useDeleteScheduleEntry()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<ScheduleFormValues>()
  const saving = createEntry.isPending || updateEntry.isPending

  const weekday = useMemo(() => new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric', month: 'short' }), [language])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    // Default to the Monday of the week being viewed, not today.
    form.setFieldsValue({ date: toIsoDate(monday), startTime: '09:00', endTime: '10:30' })
    setModalOpen(true)
  }, [form, monday])

  const openEditModal = useCallback(
    (entry: ScheduleEntry) => {
      setEditingId(entry.id)
      form.setFieldsValue({
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject,
        teacher: entry.teacher ?? undefined,
        classroom: entry.classroom ?? undefined,
        courseGroup: entry.courseGroup ?? undefined,
      })
      setModalOpen(true)
    },
    [form],
  )

  const submitForm = async () => {
    const values = await form.validateFields()

    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, payload: values })
        message.success(t('schedule.updated'))
      } else {
        await createEntry.mutateAsync(values)
        message.success(t('schedule.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('schedule.saveFailed')))
    }
  }

  const handleDelete = useCallback(
    (entry: ScheduleEntry) => {
      confirmDelete({
        target: `${entry.date} ${entry.startTime} · ${entry.subject}`,
        onConfirm: () =>
          deleteEntry.mutateAsync(entry.id).then(
            () => message.success(t('schedule.deleted')),
            (err) => message.error(getErrorMessage(err, t('schedule.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteEntry, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<ScheduleEntry>['columns']>>(
    () => [
      {
        title: t('schedule.columns.date'),
        dataIndex: 'date',
        key: 'date',
        width: 150,
        render: (value: string) => weekday.format(new Date(`${value}T00:00:00`)),
      },
      { title: t('schedule.columns.time'), key: 'time', width: 130, render: (_, e) => `${e.startTime} – ${e.endTime}` },
      { title: t('schedule.columns.subject'), dataIndex: 'subject', key: 'subject', render: (v: string) => <strong>{v}</strong> },
      { title: t('schedule.columns.group'), dataIndex: 'courseGroup', key: 'courseGroup', responsive: ['md'], render: (v?: string | null) => (v ? <Tag>{v}</Tag> : '-') },
      { title: t('schedule.columns.teacher'), dataIndex: 'teacher', key: 'teacher', responsive: ['lg'], render: (v?: string | null) => v || '-' },
      { title: t('schedule.columns.classroom'), dataIndex: 'classroom', key: 'classroom', responsive: ['lg'], width: 110, render: (v?: string | null) => v || '-' },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 90 : 170,
        render: (_, entry) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(entry)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(entry)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, openEditModal, pinActions, t, weekday],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('schedule.adminTitle')} description={t('schedule.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <div className="week-nav">
            <Button icon={<LeftOutlined />} aria-label={t('schedule.prevWeek')} onClick={() => setMonday(addDays(monday, -7))} />
            <Text strong className="week-label">{formatWeekLabel(monday, language)}</Text>
            <Button icon={<RightOutlined />} aria-label={t('schedule.nextWeek')} onClick={() => setMonday(addDays(monday, 7))} />
            <Button type="link" onClick={() => setMonday(startOfWeek(new Date()))}>
              {t('schedule.thisWeek')}
            </Button>
          </div>
          <Space>
            <Text type="secondary">{t('schedule.classesPlanned', { count: schedule.data?.length ?? 0 })}</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('schedule.add')}
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={schedule.error} fallback={t('schedule.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={schedule.data ?? []}
          rowKey="id"
          loading={schedule.isFetching}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('schedule.emptyWeek') }}
        />
      </Card>

      <Modal
        title={editingId ? t('schedule.editTitle') : t('schedule.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={640}
      >
        <Form form={form} layout="vertical" disabled={saving}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label={t('schedule.form.date')} rules={[{ required: true, message: t('schedule.form.dateRequired') }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="startTime" label={t('schedule.form.start')} rules={[{ required: true, message: t('schedule.form.timeRequired') }]}>
                <Input type="time" step={300} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="endTime"
                label={t('schedule.form.end')}
                dependencies={['startTime']}
                rules={[
                  { required: true, message: t('schedule.form.timeRequired') },
                  ({ getFieldValue }) => ({
                    validator: (_, value?: string) =>
                      !value || !getFieldValue('startTime') || value > getFieldValue('startTime')
                        ? Promise.resolve()
                        : Promise.reject(new Error(t('schedule.form.endAfterStart'))),
                  }),
                ]}
              >
                <Input type="time" step={300} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="subject" label={t('schedule.form.subject')} rules={[{ required: true, message: t('schedule.form.subjectRequired') }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacher" label={t('schedule.form.teacher')}>
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classroom" label={t('schedule.form.classroom')}>
                <Input maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="courseGroup" label={t('schedule.form.group')}>
            {/* Same 과정 list as materials and students, so labels stay consistent. */}
            <Select allowClear options={catalog.courses} placeholder={t('catalog.selectCourse')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
