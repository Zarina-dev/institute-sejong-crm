import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Dropdown, Form, Input, Modal, Select, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { termLabel } from '../../features/courses/terms'
import { useAllEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from '../../features/events/queries'
import type { ScheduleEvent } from '../../features/events/types'
import { termDisplayName } from '../../features/terms/labels'
import { useTerms } from '../../features/terms/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type EventFormValues = {
  startDate: string
  endDate?: string
  title: string
  titleKy?: string
  titleRu?: string
  titleEn?: string
  note?: string
  termCode?: string | null
  isPublished: boolean
}

const NO_EVENTS: ScheduleEvent[] = []

/**
 * 행사 일정 — the semester table the institute publishes. The name is typed
 * twice on purpose, in Korean and in Kyrgyz, because the printed table shows
 * both columns; which semester a row belongs to follows from its date, the
 * same way a class is filed.
 */
export function EventsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const events = useAllEvents()
  const terms = useTerms()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<EventFormValues>()
  const saving = createEvent.isPending || updateEvent.isPending

  const rows = events.data ?? NO_EVENTS

  const termLabels = useMemo(
    () => new Map((terms.data ?? []).map((term) => [term.code, termDisplayName(term, t)])),
    [t, terms.data],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('startDate', new Date().toISOString().slice(0, 10))
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (event: ScheduleEvent) => {
      setEditingId(event.id)
      form.setFieldsValue({
        startDate: event.startDate,
        endDate: event.endDate ?? undefined,
        title: event.title,
        titleKy: event.titleKy,
        titleRu: event.titleRu,
        titleEn: event.titleEn,
        note: event.note,
        termCode: event.termCode ?? undefined,
        isPublished: event.isPublished,
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

    const payload = { ...values, endDate: values.endDate || null, termCode: values.termCode || null }

    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, payload })
        message.success(t('events.updated'))
      } else {
        await createEvent.mutateAsync(payload)
        message.success(t('events.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('events.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (event: ScheduleEvent) => {
      updateEvent.mutate(
        { id: event.id, payload: { isPublished: !event.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('events.saveFailed'))) },
      )
    },
    [message, t, updateEvent],
  )

  const handleDelete = useCallback(
    (event: ScheduleEvent) => {
      confirmDelete({
        target: event.title,
        onConfirm: () =>
          deleteEvent.mutateAsync(event.id).then(
            () => message.success(t('events.deleted')),
            (err) => message.error(getErrorMessage(err, t('events.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteEvent, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<ScheduleEvent>['columns']>>(
    () => [
      {
        title: t('events.form.date'),
        key: 'date',
        width: 230,
        render: (_, event) => (
          <Text className="chronology-date">
            {formatDate(event.startDate, language)}
            {event.endDate ? ` ~ ${formatDate(event.endDate, language)}` : ''}
          </Text>
        ),
      },
      {
        title: t('events.form.title'),
        key: 'title',
        render: (_, event) => (
          <div className="cell-stack">
            <Text strong>{event.title}</Text>
            {event.titleKy ? <Text type="secondary">{event.titleKy}</Text> : null}
          </div>
        ),
      },
      {
        title: t('terms.label'),
        key: 'term',
        width: 150,
        responsive: ['lg'],
        render: (_, event) =>
          event.termCode ? <Tag>{termLabels.get(event.termCode) ?? termLabel(event.termCode, t)}</Tag> : <Text type="secondary">—</Text>,
      },
      {
        title: t('courses.columns.visibility'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('common.published') : t('staff.hidden')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: 90,
        align: 'center',
        render: (_, event) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(event) },
                {
                  key: 'publish',
                  icon: event.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: event.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(event),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(event) },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, language, openEditModal, pinActions, t, termLabels],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.notices')} title={t('events.adminTitle')} description={t('events.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('events.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('events.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={events.error} fallback={t('events.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={events.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('events.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('events.editTitle') : t('events.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={680}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true }}>
          {/* One day, or a span — 9–13 on the printed table. */}
          <div className="form-row">
            <Form.Item name="startDate" label={t('events.form.startDate')} rules={[{ required: true, message: t('events.form.startRequired') }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label={t('events.form.endDate')}
              extra={t('events.form.endHint')}
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
          </div>

          <Form.Item name="title" label={t('events.form.title')} rules={[{ required: true, whitespace: true, message: t('events.form.titleRequired') }]}>
            <Input maxLength={255} placeholder="2학기 개강식" />
          </Form.Item>

          <Form.Item name="titleKy" label={t('events.form.titleKy')} extra={t('events.form.titleKyHint')}>
            <Input maxLength={255} placeholder="2-семестрдин ачылыш аземи" />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="titleRu" label={t('events.form.titleRu')}>
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item name="titleEn" label={t('events.form.titleEn')}>
              <Input maxLength={255} />
            </Form.Item>
          </div>

          <Form.Item name="note" label={t('events.form.note')}>
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="termCode" label={t('terms.label')} extra={t('events.form.termHint')}>
            <Select
              allowClear
              placeholder={t('events.form.termAuto')}
              options={(terms.data ?? []).map((term) => ({ value: term.code, label: termDisplayName(term, t) }))}
            />
          </Form.Item>

          <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
